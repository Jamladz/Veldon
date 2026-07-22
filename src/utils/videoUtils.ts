export interface VideoUrlInfo {
  type: 'youtube' | 'googledrive' | 'hls' | 'mp4';
  embedUrl?: string;
  originalUrl: string;
  videoId?: string;
}

export function parseVideoUrl(url: string, autoplay: boolean = true): VideoUrlInfo {
  const safeUrl = (url || '').trim();

  // 1. YouTube Detection
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const ytMatch = safeUrl.match(ytRegExp);
  if (ytMatch && ytMatch[2] && ytMatch[2].length === 11) {
    const videoId = ytMatch[2];
    const autoParam = autoplay ? 1 : 0;
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=${autoParam}&enablejsapi=1&rel=0&playsinline=1&modestbranding=1`,
      originalUrl: safeUrl,
    };
  }

  // 2. Google Drive Detection
  if (safeUrl.includes('drive.google.com')) {
    const match = safeUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const idMatch = safeUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = (match && match[1]) || (idMatch && idMatch[1]);
    if (id) {
      return {
        type: 'googledrive',
        videoId: id,
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        originalUrl: safeUrl,
      };
    }
  }

  // 3. HLS (.m3u8)
  if (safeUrl.includes('.m3u8')) {
    return {
      type: 'hls',
      originalUrl: safeUrl,
    };
  }

  // 4. Default Direct MP4 / Video file
  return {
    type: 'mp4',
    originalUrl: safeUrl,
  };
}
