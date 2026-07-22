import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause } from 'lucide-react';

interface ReelPlayerProps {
  url: string;
  isActive: boolean;
  onProgress?: (time: number) => void;
  onComplete?: () => void;
}

export const ReelPlayer: React.FC<ReelPlayerProps> = ({ url, isActive, onProgress, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const safeUrl = url || '';
  const isGoogleDrive = safeUrl.includes('drive.google.com/file/d/') || safeUrl.includes('drive.google.com/video/d/') || safeUrl.includes('drive.google.com/open?id=');
  let googleDriveUrl = '';
  if (isGoogleDrive) {
    const match = safeUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch = safeUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = (match && match[1]) || (idMatch && idMatch[1]);
    if (id) {
      googleDriveUrl = `https://drive.google.com/file/d/${id}/preview`;
    }
  }

  useEffect(() => {
    if (isGoogleDrive || !safeUrl) return; // Handled by iframe or empty

    let hls: Hls;
    const video = videoRef.current;
    if (!video) return;

    if (safeUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(safeUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = safeUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsReady(true);
        });
      }
    } else {
      video.src = safeUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsReady(true);
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [safeUrl, isGoogleDrive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
      video.currentTime = 0; // Reset when not active
    }
  }, [isActive, isReady]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && onProgress) {
      onProgress(videoRef.current.currentTime);
    }
  };

  if (isGoogleDrive && googleDriveUrl) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <iframe
          src={googleDriveUrl}
          className="w-full h-full border-none"
          allow="autoplay; fullscreen"
          title="Google Drive Video Player"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer" onClick={togglePlay}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => onComplete && onComplete()}
        loop={false}
        playsInline
      />
      {!isPlaying && isReady && isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Play size={64} className="text-white/80 drop-shadow-2xl" fill="currentColor" />
        </div>
      )}
    </div>
  );
};
