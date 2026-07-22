import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { MovieCard } from '../components/MovieCard';
import { Play, Search } from 'lucide-react';
import { fetchMoviesFromDB } from '../services/movieService';

export const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { movies, setMovies, coins } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

  useEffect(() => {
    if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
      setAvatar((window as any).Telegram.WebApp.initDataUnsafe.user.photo_url);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMoviesFromDB();
        setMovies(data);
      } catch (err) {
        console.error("Error fetching movies", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setMovies]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-600">
        <div className="animate-pulse flex items-center gap-2">
          <Play size={32} fill="currentColor" />
          <span className="font-bold tracking-widest uppercase">{t('loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white/50 space-y-4">
        <p className="font-bold">{t('noContent', 'No content available')}</p>
        <button onClick={() => window.location.href = '/admin'} className="bg-red-600 px-4 py-2 rounded-lg text-white font-bold text-sm">
          {t('goToAdmin', 'Go to Admin Panel')}
        </button>
      </div>
    );
  }

  const featured = movies[0];
  const trending = [...movies].sort((a, b) => b.views - a.views);
  const newReleases = [...movies].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="h-full w-full flex flex-col bg-[#050505] overflow-y-auto overflow-x-hidden pb-24 hide-scrollbar">
      {/* Header/App Bar */}
      <header className="sticky top-0 flex-none flex items-center justify-between p-6 z-40 bg-[#050505]/80 ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(229,9,20,0.3)]">
             <Play size={24} className="text-white ml-1" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white">DRAMA<span className="text-red-600">REEL</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/search')}
            className="w-9 h-9 flex items-center justify-center bg-[#1A1A1A] rounded-full border border-white/5 text-white/70 hover:text-white transition-colors active:opacity-80"
          >
            <Search size={18} />
          </button>
          <div className="flex items-center gap-2 bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">$</div>
            <span className="text-xs font-semibold text-white">{coins}</span>
          </div>
          <button onClick={() => navigate('/profile')} className="active:opacity-80 transition-transform">
            <img src={avatar} className="w-9 h-9 rounded-full border border-red-600/30 bg-[#1A1A1A] object-cover" alt="avatar" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        {/* Hero / Featured */}
        <div className="px-6 relative h-[450px]">
          <div className="h-full w-full">
            <MovieCard movie={featured} featured />
          </div>
        </div>

        {/* Trending Section */}
        <div className="py-2">
          <div className="px-6 flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white tracking-tight">{t('trendingToday')}</h3>
            <button onClick={() => navigate('/search')} className="text-red-600 text-xs font-bold hover:underline">{t('viewAll', 'View All')}</button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x hide-scrollbar">
            {trending.map(movie => (
              <div key={movie.id} className="snap-start shrink-0">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>

        {/* New Releases Section */}
        <div className="py-2">
          <div className="px-6 flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white tracking-tight">{t('newReleases')}</h3>
            <button onClick={() => navigate('/search')} className="text-red-600 text-xs font-bold hover:underline">{t('viewAll', 'View All')}</button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x hide-scrollbar">
            {newReleases.map(movie => (
              <div key={`new-${movie.id}`} className="snap-start shrink-0">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
