import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { MovieCard } from '../components/MovieCard';
import { HeartOff } from 'lucide-react';

export const Favorites = () => {
  const { t } = useTranslation();
  const { movies, favorites } = useAppStore();

  const favoriteMovies = movies.filter(m => favorites.includes(m.id));

  return (
    <div className="h-full w-full overflow-hidden bg-[#050505] flex flex-col p-6">
      <h1 className="flex-none text-2xl font-black text-white mb-6 uppercase tracking-tighter">{t('favorites')}</h1>
      
      <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        {favoriteMovies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteMovies.map(movie => (
              <div key={movie.id} className="h-64 sm:h-80">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-white/30 h-full space-y-4">
            <HeartOff size={48} className="opacity-50" />
            <p className="font-bold uppercase tracking-widest text-sm">{t('noFavorites', 'No favorites yet.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
