import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { parseVideoUrl } from '../utils/videoUtils';

interface ReelPlayerProps {
  url: string;
  isActive: boolean;
  onProgress?: (time: number) => void;
  onComplete?: () => void;
}

export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, onProgress, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isActiveRef = useRef(isActive);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  const parsed = parseVideoUrl(url, isActive);

  // Synchronously update isActiveRef
  useEffect(() => {
    isActiveRef.current = isActive;
    const video = videoRef.current;
    
    if (!isActive && video) {
      // Force immediate pause & mute when inactive to prevent sound leakage during rapid swiping
      try {
        video.pause();
        video.currentTime = 0;
      } catch (e) {
        // ignore video state error
      }
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (parsed.type === 'youtube' || parsed.type === 'googledrive' || !parsed.originalUrl) return;

    let hls: Hls | null = null;
    const video = videoRef.current;
    if (!video) return;

    setIsReady(false);
    setIsBuffering(true);

    if (parsed.type === 'hls') {
      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(parsed.originalUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
          setIsBuffering(false);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = parsed.originalUrl;
        const handleMetadata = () => {
          setIsReady(true);
          setIsBuffering(false);
        };
        video.addEventListener('loadedmetadata', handleMetadata);
        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
        };
      }
    } else {
      video.src = parsed.originalUrl;
      const handleMetadata = () => {
        setIsReady(true);
        setIsBuffering(false);
      };
      video.addEventListener('loadedmetadata', handleMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleMetadata);
      };
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [parsed.originalUrl, parsed.type]);

  // Master Playback Trigger based on isActive and isReady
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive && isReady) {
      // Unmute & attempt playback
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Check if user swiped away while play promise was fulfilling
            if (!isActiveRef.current) {
              video.pause();
              video.currentTime = 0;
              setIsPlaying(false);
            } else {
              setIsPlaying(true);
              setIsBuffering(false);
            }
          })
          .catch((err) => {
            console.warn('Playback prevented:', err);
            setIsPlaying(false);
          });
      }
    } else {
      // Immediately stop & pause
      video.pause();
      setIsPlaying(false);
      try {
        video.currentTime = 0;
      } catch (e) {}
    }
  }, [isActive, isReady, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setShowControlIcon('pause');
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        setShowControlIcon('play');
      }).catch(() => setIsPlaying(false));
    }

    setTimeout(() => {
      setShowControlIcon(null);
    }, 600);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMute = !isMuted;
    video.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(pct);
    }
    if (onProgress) {
      onProgress(video.currentTime);
    }
  };

  if (parsed.type === 'youtube' && parsed.embedUrl) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {isActive ? (
          <iframe
            src={parsed.embedUrl}
            className="w-full h-full border-none pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title="YouTube Video Player"
          />
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center relative">
            {parsed.videoId ? (
              <img
                src={`https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`}
                alt="YouTube Thumbnail"
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="text-white/40 text-xs">YouTube Video</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-14 h-14 bg-red-600/80 rounded-full flex items-center justify-center text-white">
                <Play size={28} fill="white" className="ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (parsed.type === 'googledrive' && parsed.embedUrl) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        {isActive && (
          <iframe
            src={parsed.embedUrl}
            className="w-full h-full border-none"
            allow="autoplay; fullscreen"
            title="Google Drive Video Player"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden" onClick={togglePlay}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onComplete) onComplete();
        }}
        loop={false}
        playsInline
      />

      {/* Buffering Indicator */}
      {isBuffering && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
          <Loader2 size={48} className="text-red-500 animate-spin" />
        </div>
      )}

      {/* Play/Pause Popup Anim */}
      {showControlIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-20 transition-all">
          <div className="w-20 h-20 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md animate-ping">
            {showControlIcon === 'play' ? <Play size={40} fill="white" /> : <Pause size={40} fill="white" />}
          </div>
        </div>
      )}

      {/* Static Play Overlay when Paused */}
      {!isPlaying && !isBuffering && isReady && isActive && !showControlIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(229,9,20,0.6)] backdrop-blur-sm transition-transform hover:scale-110">
            <Play size={32} fill="white" className="ml-1" />
          </div>
        </div>
      )}

      {/* Top Sound Toggle Button */}
      {isActive && (
        <button
          onClick={toggleMute}
          className="absolute top-16 right-4 z-30 w-9 h-9 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-transform"
        >
          {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-white" />}
        </button>
      )}

      {/* Bottom Progress Bar */}
      {isActive && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-30">
          <div
            className="h-full bg-red-600 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

