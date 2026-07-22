import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Loader2, WifiOff } from 'lucide-react';
import { parseVideoUrl } from '../utils/videoUtils';

interface ReelPlayerProps {
  url: string;
  isActive: boolean;
  duration?: number; // duration in seconds set by admin
  onProgress?: (time: number) => void;
  onComplete?: () => void;
}

export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, duration, onProgress, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isActiveRef = useRef(isActive);
  const onCompleteCalledRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [iframeState, setIframeState] = useState<'playing' | 'buffering' | 'paused'>('playing');
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  const parsed = parseVideoUrl(url, isActive);

  // Monitor online / offline network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Synchronously update isActiveRef & reset state on inactive
  useEffect(() => {
    isActiveRef.current = isActive;
    const video = videoRef.current;
    
    if (!isActive) {
      onCompleteCalledRef.current = false;
      setWatchedSeconds(0);
      if (video) {
        try {
          video.pause();
          video.currentTime = 0;
        } catch (e) {}
        setIsPlaying(false);
      }
    } else {
      onCompleteCalledRef.current = false;
      setWatchedSeconds(0);
    }
  }, [isActive]);

  // Intelligent Watch Counter (Only increments when active & video is ACTUALLY playing, not buffering/paused/offline)
  useEffect(() => {
    if (!isActive || !duration || duration <= 0) return;

    const interval = setInterval(() => {
      if (onCompleteCalledRef.current) return;

      // Check if network or player is buffering/paused
      const canCount = isOnline && 
        document.visibilityState === 'visible' && 
        (parsed.embedUrl ? (iframeState === 'playing') : (isPlaying && !isBuffering));

      if (canCount) {
        setWatchedSeconds(prev => {
          const next = prev + 1;
          if (next >= duration) {
            if (!onCompleteCalledRef.current) {
              onCompleteCalledRef.current = true;
              if (onComplete) onComplete();
            }
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, duration, isOnline, iframeState, isPlaying, isBuffering, parsed.embedUrl, onComplete]);

  useEffect(() => {
    if (parsed.embedUrl || !parsed.originalUrl) return;

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

  // Handle player state & completion messages from embedded iframe players
  useEffect(() => {
    if (!isActive) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (_) {}
        }
        if (!data) return;

        // YouTube player states: 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 0 = ENDED
        if (data.event === 'onStateChange') {
          const state = data.info?.playerState ?? data.info;
          if (state === 1) setIframeState('playing');
          if (state === 2) setIframeState('paused');
          if (state === 3) setIframeState('buffering');
          if (state === 0) {
            if (!onCompleteCalledRef.current) {
              onCompleteCalledRef.current = true;
              if (onComplete) onComplete();
            }
          }
        }

        // Generic ended events
        if (data.event === 'ended' || data.event === 'video_end' || data.event === 'video_ended' || data === 'ended') {
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            if (onComplete) onComplete();
          }
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isActive, onComplete]);

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

    // Check if HTML5 video reached admin duration target
    if (duration && duration > 0 && video.currentTime >= duration) {
      if (!onCompleteCalledRef.current) {
        onCompleteCalledRef.current = true;
        if (onComplete) onComplete();
      }
    }

    if (video.duration) {
      const targetDuration = (duration && duration > 0) ? Math.min(duration, video.duration) : video.duration;
      const pct = Math.min(100, (video.currentTime / targetDuration) * 100);
      setProgress(pct);
    }
    if (onProgress) {
      onProgress(video.currentTime);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (parsed.embedUrl) {
    const isBufferingOrOffline = !isOnline || iframeState === 'buffering';

    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {isActive ? (
          <div className="relative w-full h-full">
            <iframe
              src={parsed.embedUrl}
              className="w-full h-full border-none pointer-events-auto scale-[1.02]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title="Video Player"
            />
            {/* Transparent Touch Shield Layer - prevents touching internal video controls while enabling smooth vertical scrolling */}
            <div className="absolute inset-0 z-20 bg-transparent pointer-events-auto touch-pan-y" />

            {/* Smart Network / Buffering Overlay Sensor */}
            {isBufferingOrOffline && (
              <div className="absolute top-16 left-4 z-30 flex items-center gap-2 bg-black/80 text-amber-400 text-xs px-3 py-1.5 rounded-full border border-amber-500/30 shadow-lg backdrop-blur-md animate-pulse">
                {!isOnline ? <WifiOff size={14} /> : <Loader2 size={14} className="animate-spin" />}
                <span>{!isOnline ? 'لا يوجد اتصال بالإنترنت' : 'جاري التحميل... المؤقت متوقف'}</span>
              </div>
            )}

            {/* Duration Timer Badge if set by admin */}
            {duration && duration > 0 && (
              <div className="absolute top-16 right-4 z-30 bg-black/75 border border-white/10 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-amber-400 backdrop-blur-md shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>{formatTime(watchedSeconds)} / {formatTime(duration)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center relative">
            {parsed.thumbnailUrl ? (
              <img
                src={parsed.thumbnailUrl}
                alt="Video Thumbnail"
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="text-white/40 text-xs font-mono uppercase tracking-widest">{parsed.type} Video</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <Play size={28} fill="white" className="ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isHtml5Buffering = !isOnline || isBuffering;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden" onClick={togglePlay}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsBuffering(true)}
        onStalled={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (!onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            if (onComplete) onComplete();
          }
        }}
        loop={false}
        playsInline
      />

      {/* Buffering or Network Slow Sensor */}
      {isHtml5Buffering && isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none z-20 gap-3 backdrop-blur-[2px]">
          <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/30">
            {!isOnline ? <WifiOff size={24} /> : <Loader2 size={24} className="animate-spin text-red-500" />}
          </div>
          <span className="text-xs font-bold text-amber-300 bg-black/80 px-3 py-1 rounded-full border border-amber-500/20 shadow-md">
            {!isOnline ? 'انقطاع الاتصال بالإنترنت' : 'ضعف في الشبكة... جاري التحميل'}
          </span>
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

      {/* Top Controls: Sound Toggle & Duration Counter */}
      {isActive && (
        <div className="absolute top-16 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
          {duration && duration > 0 ? (
            <div className="bg-black/75 border border-white/10 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-amber-400 backdrop-blur-md shadow-md flex items-center gap-1.5 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{formatTime(watchedSeconds)} / {formatTime(duration)}</span>
            </div>
          ) : <div />}

          <button
            onClick={toggleMute}
            className="w-9 h-9 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-transform pointer-events-auto"
          >
            {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-white" />}
          </button>
        </div>
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

