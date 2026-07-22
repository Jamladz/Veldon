import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Share2, MessageCircle, Bookmark, PlayCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { ReelPlayer } from '../components/ReelPlayer';
import { Movie } from '../types';

export const ForYou = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { movies, toggleFavorite, favorites, unlockedEpisodes, spendCoins, unlockEpisode, coins } = useAppStore();
  
  const [showUnlockModal, setShowUnlockModal] = useState<string | null>(null);

  // Combine all episodes from all movies
  const allEpisodes = useMemo(() => {
    let feed: { movie: Movie, episode: any }[] = [];
    movies.forEach(movie => {
      if (movie.episodes && movie.episodes.length > 0) {
        movie.episodes.forEach(ep => {
          feed.push({ movie, episode: ep });
        });
      } else {
        feed.push({ movie, episode: {
          id: movie.id,
          episodeNumber: 1,
          title: movie.title,
          videoUrl: movie.videoUrl || ''
        }});
      }
    });
    // Randomize feed (a stable shuffle could be used, but simple random for now)
    return feed.sort(() => Math.random() - 0.5);
  }, [movies]);

  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (allEpisodes.length > 0 && !activeEpisodeId) {
      setActiveEpisodeId(allEpisodes[0].episode.id);
    }
  }, [allEpisodes, activeEpisodeId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const epId = entry.target.getAttribute('data-episode-id');
            if (epId) setActiveEpisodeId(epId);
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    const children = container.querySelectorAll('.reel-item');
    children.forEach((child) => observer.current?.observe(child));

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [allEpisodes]);

  if (allEpisodes.length === 0) return null;

  return (
    <div className="bg-black fixed inset-0 z-50 flex flex-col pb-24">
      {/* Top Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex items-center justify-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="px-4 py-1.5 bg-black/40  rounded-full text-white font-bold text-sm pointer-events-auto border border-white/10">
          {t('forYou', 'For You')}
        </div>
      </div>

      {/* Vertical Scroll Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {allEpisodes.map((item, index) => {
          const { movie, episode: ep } = item;
          const isFav = favorites.includes(movie.id);
          const isLocked = ep.episodeNumber > 2 && !unlockedEpisodes.includes(ep.id);
          const isCurrentActive = activeEpisodeId === ep.id;
          
          // Need unique key because same episode might appear (shouldn't if feed is unique, but just in case)
          const uniqueKey = `${ep.id}-${index}`;

          return (
          <div 
            key={uniqueKey} 
            data-episode-id={ep.id}
            className="reel-item relative w-full h-full snap-start snap-always"
          >
            {isLocked ? (
              <div className="absolute inset-0 bg-[#050505] flex flex-col items-center justify-center z-10 px-6 text-center">
                <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('lockedEpisode', 'Locked Episode')}</h3>
                <p className="text-white/60 text-sm mb-6">{t('unlockToWatch', 'Unlock this episode to continue watching')}</p>
                <button 
                  onClick={() => setShowUnlockModal(ep.id)}
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_4px_20px_rgba(229,9,20,0.5)] active:opacity-80 transition-transform"
                >
                  {t('unlockForCoins', 'Unlock for 50 Coins')}
                </button>
              </div>
            ) : (
              <ReelPlayer 
                url={ep.videoUrl} 
                isActive={isCurrentActive}
                onComplete={() => useAppStore.getState().completeEpisode(ep.id)}
              />
            )}

            {/* Right Side Actions */}
            <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20 pointer-events-auto">
              <button 
                onClick={() => toggleFavorite(movie.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/30  rounded-full flex items-center justify-center text-white border border-white/20 group-active:opacity-80 transition-transform shadow-lg">
                  <Heart size={24} className={isFav ? "fill-red-500 text-red-500" : ""} />
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{(movie.rating * 1000).toLocaleString()}</span>
              </button>
              
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 bg-black/30  rounded-full flex items-center justify-center text-white border border-white/20 group-active:opacity-80 transition-transform shadow-lg">
                  <MessageCircle size={24} className="fill-white/80" />
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">2.1K</span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 bg-black/30  rounded-full flex items-center justify-center text-white border border-white/20 group-active:opacity-80 transition-transform shadow-lg">
                  <Bookmark size={24} className="fill-white/80" />
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{t('save', 'Save')}</span>
              </button>

              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: movie.title,
                      text: `Watch ${movie.title} on Drama Reel!`,
                      url: window.location.href
                    }).catch(console.error);
                  }
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/30  rounded-full flex items-center justify-center text-white border border-white/20 group-active:opacity-80 transition-transform shadow-lg">
                  <Share2 size={24} />
                </div>
                <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{t('share', 'Share')}</span>
              </button>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-12 p-3 pb-28 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
              <div 
                className="pointer-events-auto opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-white font-bold text-sm tracking-tight drop-shadow-md">
                    {movie.title}
                  </h3>
                  <span className="px-1.5 py-0.5 bg-red-600/80 text-white text-[9px] font-bold rounded uppercase tracking-widest">
                    {t('episodes', 'Ep')} {ep.episodeNumber}
                  </span>
                </div>
                <p className="text-white/70 text-[10px] line-clamp-2 drop-shadow-md mb-2 max-w-[80%]">
                  {ep.title !== movie.title ? `${ep.title} - ` : ''}{movie.description}
                </p>
                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1 py-0.5 bg-white/10  text-white text-[8px] font-bold rounded uppercase tracking-widest">
                      {movie.category}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/watch/${movie.id}?ep=${ep.id}`);
                    }}
                    className="flex items-center justify-center gap-2 w-[85%] bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-lg shadow-red-600/20 active:opacity-80"
                  >
                    <PlayCircle size={16} />
                    {t('continueWatching', 'Continue Watching')}
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="absolute inset-0 z-[60] bg-black/80  flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
              <span className="text-2xl text-yellow-500 font-bold">50</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('unlockEpisode', 'Unlock Episode')}</h3>
            <p className="text-white/60 text-sm mb-6">
              {t('unlockCost', 'This episode costs 50 coins to unlock. You have')} <span className="font-bold text-yellow-500">{coins} {t('coins', 'Coins')}</span>.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowUnlockModal(null)}
                className="flex-1 py-3 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button 
                onClick={() => {
                  if (spendCoins(50)) {
                    unlockEpisode(showUnlockModal);
                    setShowUnlockModal(null);
                  } else {
                    alert(t('notEnoughCoins', 'Not enough coins. Get more in your profile!'));
                    setShowUnlockModal(null);
                    navigate('/profile');
                  }
                }}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-yellow-600 to-orange-500 text-white font-bold text-sm hover:from-yellow-500 hover:to-orange-400 transition-colors shadow-lg"
              >
                {t('unlockNow', 'Unlock Now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
