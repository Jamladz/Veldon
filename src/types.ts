export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration?: number;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  largeImage?: string;
  trailerUrl?: string;
  videoUrl: string; // URL for HLS or standard mp4
  episodes?: Episode[];
  releaseYear: number;
  duration: number; // in minutes
  episodesCount: number;
  rating: number;
  views: number;
  category: string;
  country: string;
  language: string;
  director?: string;
  cast?: string[];
  tags?: string[];
  createdAt: number;
}

export interface UserProfile {
  id: string;
  telegramId?: string;
  name: string;
  username: string;
  photoUrl: string;
  watchedHours: number;
  moviesCount: number;
  seriesCount: number;
  favoritesCount: number;
  streakDays: number;
  coins: number;
  subscription: 'free' | 'premium';
  lastLoginAt: number;
}

export interface WatchHistoryItem {
  movieId: string;
  lastWatchedMinute: number;
  percentage: number;
  updatedAt: number;
}
