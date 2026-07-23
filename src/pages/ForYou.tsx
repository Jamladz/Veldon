import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Share2, MessageCircle, Bookmark, PlayCircle, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { ReelPlayer } from '../components/ReelPlayer';
import { Movie } from '../types';

export const ForYou = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { movies, toggleFavorite, favorites, unlockedEpisodes, spendCoins, unlockEpisode, coins, isVipActive } = useAppStore();
  const isVip = isVipActive();
  
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

  const scrollToNext = (nextIndex: number) => {
    if (nextIndex < allEpisodes.length && containerRef.current) {
      const nextItem = allEpisodes[nextIndex];
      if (nextItem) {
        setActiveEpisodeId(nextItem.episode.id);
        const children = containerRef.current.querySelectorAll('.reel-item');
        if (children[nextIndex]) {
          children[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const height = container.clientHeight;
    if (height <= 0) return;
    const index = Math.round(container.scrollTop / height);
    if (allEpisodes[index] && allEpisodes[index].episode.id !== activeEpisodeId) {
      setActiveEpisodeId(allEpisodes[index].episode.id);
    }
  };

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
      <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="px-4 py-1.5 bg-black/40  rounded-full text-white font-bold text-sm pointer-events-auto border border-white/10">
          {t('forYou', 'For You')}
        </div>
      </div>

      {/* Vertical Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar touch-pan-y"
        style={{ scrollBehavior: 'smooth' }}
      >
        {allEpisodes.map((item, index) => {
          const { movie, episode: ep } = item;
          const isFav = favorites.includes(movie.id);
          const isLocked = !isVip && ep.episodeNumber > 2 && !unlockedEpisodes.includes(ep.id);
          const isCurrentActive = activeEpisodeId === ep.id;
          
          // Need unique key because same episode might appear (shouldn't if feed is unique, but just in case)
          const uniqueKey = `${ep.id}-${index}`;

          return (
          <div 
            key={uniqueKey} 
            data-episode-id={ep.id}
            className="reel-item relative w-full h-full snap-start snap-always touch-pan-y"
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
                duration={ep.duration}
                onComplete={() => {
                  useAppStore.getState().completeEpisode(ep.id);
                  setTimeout(() => {
                    scrollToNext(index + 1);
                  }, 300);
                }}
              />
            )}

            {/* Right Side Action Buttons */}
            <div className="absolute right-3.5 bottom-24 flex flex-col items-center gap-4 z-20 pointer-events-auto">
              {/* Series Avatar Poster with Plus Badge */}
              <div 
                className="relative mb-1 group cursor-pointer"
                onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
              >
                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 shadow-xl shadow-red-600/20 group-active:scale-95 transition-transform">
                  <img 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-red-600 text-white rounded-full p-0.5 shadow-md border border-black">
                  <Plus size={12} strokeWidth={3} />
                </div>
              </div>

              {/* Like / Favorite Button */}
              <button 
                onClick={() => toggleFavorite(movie.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 border shadow-lg group-active:scale-90 ${
                  isFav 
                    ? "bg-red-600/30 border-red-500/60 text-red-500 shadow-red-600/30" 
                    : "bg-black/45 border-white/15 text-white hover:border-white/30"
                }`}>
                  <Heart size={24} className={isFav ? "fill-red-500 text-red-500 animate-bounce" : "text-white"} />
                </div>
                <span className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {(movie.rating * 1250).toLocaleString()}
                </span>
              </button>
              
              {/* Comments Button */}
              <button 
                onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/45 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/15 group-active:scale-90 transition-all shadow-lg hover:border-white/30">
                  <MessageCircle size={22} className="fill-white/20" />
                </div>
                <span className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  2.4K
                </span>
              </button>

              {/* Save / Bookmark Button */}
              <button 
                onClick={() => toggleFavorite(movie.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/45 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/15 group-active:scale-90 transition-all shadow-lg hover:border-white/30">
                  <Bookmark size={22} className={isFav ? "fill-amber-400 text-amber-400" : "fill-white/20"} />
                </div>
                <span className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {t('save', 'حفظ')}
                </span>
              </button>

              {/* Share Button */}
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: movie.title,
                      text: `مشاهدة ${movie.title} على Drama Reel!`,
                      url: window.location.href
                    }).catch(console.error);
                  }
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-600/25 border border-indigo-400/30 group-active:scale-90 transition-all">
                  <Share2 size={22} />
                </div>
                <span className="text-indigo-300 text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {t('share', 'مشاركة')}
                </span>
              </button>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none">
              <div 
                className="pointer-events-auto space-y-2 cursor-pointer"
                onClick={() => navigate(`/watch/${movie.id}?ep=${ep.id}`)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-md border border-red-400/30">
                    {t('episodes', 'الحلقة')} {ep.episodeNumber}
                  </span>
                  <span className="px-2 py-0.5 bg-white/15 text-white/90 text-[10px] font-bold rounded-full backdrop-blur-md border border-white/10">
                    {movie.category}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full backdrop-blur-md border border-amber-500/30 flex items-center gap-1">
                    ★ {movie.rating}
                  </span>
                </div>

                <h3 className="text-white font-extrabold text-base tracking-tight drop-shadow-lg truncate max-w-[250px]">
                  {movie.title}
                </h3>

                <p className="text-white/80 text-xs line-clamp-2 leading-relaxed drop-shadow-md">
                  {ep.title !== movie.title ? `${ep.title} - ` : ''}{movie.description}
                </p>

                <div className="pt-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/watch/${movie.id}?ep=${ep.id}`);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-red-600/30 flex items-center gap-1.5 border border-red-400/30 active:scale-95 transition-all"
                  >
                    <PlayCircle size={14} />
                    <span>{t('watchFullMovie', 'مشاهدة المسلسل')}</span>
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
                  if (spendCoins(50, 'فتح حلقة للمشاهدة')) {
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
