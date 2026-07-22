import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Movie, UserProfile, WatchHistoryItem } from './types';

interface AppState {
  user: UserProfile | null;
  movies: Movie[];
  favorites: string[];
  history: Record<string, WatchHistoryItem>;
  coins: number;
  unlockedEpisodes: string[];
  watchedHours: number;
  moviesCount: number;
  seriesCount: number;
  streakDays: number;
  lastDailyReward: number | null;
  lastAdWatch: number | null;
  premiumUntil: number | null;
  completedEpisodes: string[];
  setUser: (user: UserProfile | null) => void;
  setMovies: (movies: Movie[]) => void;
  toggleFavorite: (movieId: string) => void;
  updateHistory: (movieId: string, item: WatchHistoryItem) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  unlockEpisode: (episodeId: string) => void;
  claimDailyReward: () => boolean;
  claimAdReward: () => boolean;
  setPremiumUntil: (timestamp: number) => void;
  completeEpisode: (episodeId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      movies: [],
      favorites: [],
      history: {},
      coins: 0,
      unlockedEpisodes: [],
      watchedHours: 0,
      moviesCount: 0,
      seriesCount: 0,
      streakDays: 0,
      lastDailyReward: null,
      lastAdWatch: null,
      premiumUntil: null,
      completedEpisodes: [],
      setUser: (user) => set({ user }),
      setMovies: (movies) => set({ movies }),
      toggleFavorite: (movieId) => set((state) => {
        const isFav = state.favorites.includes(movieId);
        return {
          favorites: isFav 
            ? state.favorites.filter(id => id !== movieId)
            : [...state.favorites, movieId]
        };
      }),
      updateHistory: (movieId, item) => set((state) => ({
        history: {
          ...state.history,
          [movieId]: item
        }
      })),
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      spendCoins: (amount) => {
        let success = false;
        set((state) => {
          if (state.coins >= amount) {
            success = true;
            return { coins: state.coins - amount };
          }
          return state;
        });
        return success;
      },
      unlockEpisode: (episodeId) => set((state) => {
        if (!state.unlockedEpisodes.includes(episodeId)) {
          return { unlockedEpisodes: [...state.unlockedEpisodes, episodeId] };
        }
        return state;
      }),
      claimDailyReward: () => {
        const state = get();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (!state.lastDailyReward || now - state.lastDailyReward >= oneDay) {
          set({ coins: state.coins + 50, lastDailyReward: now });
          return true;
        }
        return false;
      },
      claimAdReward: () => {
        const state = get();
        const now = Date.now();
        const cooldown = 5 * 60 * 1000; // 5 minutes cooldown
        if (!state.lastAdWatch || now - state.lastAdWatch >= cooldown) {
          set({ coins: state.coins + 20, lastAdWatch: now });
          return true;
        }
        return false;
      },
      setPremiumUntil: (timestamp: number) => set({ premiumUntil: timestamp }),
      completeEpisode: (episodeId: string) => {
        set((state) => {
          if (state.completedEpisodes.includes(episodeId)) {
            return state;
          }
          return { 
            coins: state.coins + 5,
            completedEpisodes: [...state.completedEpisodes, episodeId]
          };
        });
      }
    }),
    {
      name: 'drama-reel-storage',
      partialize: (state) => ({ 
        coins: state.coins, 
        unlockedEpisodes: state.unlockedEpisodes,
        favorites: state.favorites,
        lastDailyReward: state.lastDailyReward,
        lastAdWatch: state.lastAdWatch,
        premiumUntil: state.premiumUntil,
        completedEpisodes: state.completedEpisodes
      }),
    }
  )
);
