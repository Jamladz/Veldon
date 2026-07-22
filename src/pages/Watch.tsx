import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Heart, Share2, MessageCircle, Bookmark, Layers, Gift, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store';
import { ReelPlayer } from '../components/ReelPlayer';
import { ReferralHub } from '../components/ReferralHub';

export const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const { movies, toggleFavorite, favorites, unlockedEpisodes, spendCoins, unlockEpisode, coins } = useAppStore();
  
  const movie = useMemo(() => movies.find(m => m.id === id), [movies, id]);
  const isFav = movie ? favorites.includes(movie.id) : false;

  const [showUnlockModal, setShowUnlockModal] = useState<string | null>(null);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  const episodes = useMemo(() => {
    if (!movie) return [];
    if (movie.episodes && movie.episodes.length > 0) {
      return [...movie.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
    }
    return [{
      id: movie.id,
      episodeNumber: 1,
      title: movie.title,
      videoUrl: movie.videoUrl || ''
    }];
  }, [movie]);

  const [activeEpisodeId, setActiveEpisodeId] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const epParam = params.get('ep');
    if (epParam && episodes.find(e => e.id === epParam)) {
      setActiveEpisodeId(epParam);
    } else if (episodes.length > 0 && !activeEpisodeId) {
      setActiveEpisodeId(episodes[0].id);
    }
  }, [location.search, episodes, activeEpisodeId]);

  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!movie) {
      navigate('/');
    }
  }, [movie, navigate]);

  // Scroll to active episode on initial load or drawer click
  const scrollToEpisode = (epId: string) => {
    setActiveEpisodeId(epId);
    if (containerRef.current) {
      const el = containerRef.current.querySelector(`[data-episode-id="${epId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const epParam = params.get('ep');
    if (epParam && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-episode-id="${epParam}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, [location.search, episodes]);

  // Precise IntersectionObserver for fast swipe switching
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const epId = entry.target.getAttribute('data-episode-id');
            if (epId) setActiveEpisodeId(epId);
          }
        });
      },
      {
        root: container,
        threshold: [0.5, 0.7],
      }
    );

    const children = container.querySelectorAll('.reel-item');
    children.forEach((child) => observer.current?.observe(child));

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [episodes]);

  if (!movie || episodes.length === 0) return null;

  const currentEpIndex = episodes.findIndex(e => e.id === activeEpisodeId);
  const currentEp = episodes[currentEpIndex] || episodes[0];

  return (
    <div className="bg-black fixed inset-0 z-50 flex flex-col select-none" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Top Header overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-10 flex items-center justify-between z-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white shadow-lg border border-white/10 active:scale-95 transition-transform"
          >
            <ArrowLeft size={22} className={isArabic ? 'rotate-180' : ''} />
          </button>
          
          <button 
            onClick={() => setShowEpisodeDrawer(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white font-bold text-xs border border-white/15 backdrop-blur-md active:scale-95 transition-transform"
          >
            <Layers size={14} className="text-red-500" />
            <span>{isArabic ? `الحلقة ${currentEp?.episodeNumber || 1}` : `Ep ${currentEp?.episodeNumber || 1}`}</span>
            <span className="text-white/40">/ {episodes.length}</span>
          </button>
        </div>

        {/* Earn Coins / Refer Button */}
        <button 
          onClick={() => setShowReferralModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 border border-yellow-400/30 pointer-events-auto active:scale-95 transition-transform"
        >
          <Gift size={14} className="animate-bounce" />
          <span>+250</span>
        </button>
      </div>

      {/* Vertical Scroll Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {episodes.map((ep, idx) => {
          const isLocked = ep.episodeNumber > 2 && !unlockedEpisodes.includes(ep.id);
          const isCurrentActive = activeEpisodeId === ep.id;

          return (
            <div 
              key={ep.id} 
              data-episode-id={ep.id}
              className="reel-item relative w-full h-full snap-start snap-always"
            >
              {isLocked ? (
                <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-10 px-6 text-center">
                  <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isArabic ? `الحلقة ${ep.episodeNumber} مغلقة` : `Episode ${ep.episodeNumber} Locked`}
                  </h3>
                  <p className="text-white/60 text-xs mb-6 max-w-xs">
                    {isArabic ? 'قم بفتح هذه الحلقة لمتابعة مشاهدة أحداث المسلسل الممتعة' : 'Unlock this episode to continue watching'}
                  </p>
                  <button 
                    onClick={() => setShowUnlockModal(ep.id)}
                    className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-3 px-8 rounded-full shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-95 transition-transform text-sm"
                  >
                    {isArabic ? 'فتح مقابل 50 نقطة' : 'Unlock for 50 Coins'}
                  </button>
                </div>
              ) : (
                <ReelPlayer 
                  url={ep.videoUrl} 
                  isActive={isCurrentActive}
                  onComplete={() => {
                    useAppStore.getState().completeEpisode(ep.id);
                    // Auto scroll to next episode if available
                    if (idx + 1 < episodes.length) {
                      scrollToEpisode(episodes[idx + 1].id);
                    }
                  }}
                />
              )}

              {/* Right Side Actions */}
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20 pointer-events-auto">
                <button 
                  onClick={() => toggleFavorite(movie.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-active:scale-90 transition-transform shadow-lg">
                    <Heart size={24} className={isFav ? "fill-red-500 text-red-500" : ""} />
                  </div>
                  <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {(movie.rating * 1000).toLocaleString()}
                  </span>
                </button>
                
                <button 
                  onClick={() => setShowEpisodeDrawer(true)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-active:scale-90 transition-transform shadow-lg">
                    <Layers size={22} className="text-red-400" />
                  </div>
                  <span className="text-white text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {isArabic ? 'الحلقات' : 'Episodes'}
                  </span>
                </button>

                <button 
                  onClick={() => setShowReferralModal(true)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-tr from-amber-600 to-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-active:scale-90 transition-transform">
                    <Share2 size={22} />
                  </div>
                  <span className="text-amber-400 text-[10px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {isArabic ? 'إحالة' : 'Invite'}
                  </span>
                </button>
              </div>

              {/* Bottom Episode Info Overlay */}
              <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
                <div className="pointer-events-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-red-600 text-white font-extrabold text-[10px] rounded uppercase tracking-wider">
                      {isArabic ? `الحلقة ${ep.episodeNumber}` : `Ep ${ep.episodeNumber}`}
                    </span>
                    <h3 className="text-white font-bold text-sm tracking-tight drop-shadow-md truncate max-w-[200px]">
                      {ep.title}
                    </h3>
                  </div>
                  <p className="text-white/70 text-[11px] line-clamp-2 drop-shadow-md mb-2">
                    {movie.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Episode Selection Sheet / Drawer */}
      {showEpisodeDrawer && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-end justify-center p-0">
          <div className="bg-[#121212] border-t border-white/10 rounded-t-3xl w-full max-w-md max-h-[70vh] flex flex-col p-5 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="text-red-500" size={20} />
                <h3 className="text-base font-bold text-white">
                  {isArabic ? 'اختر الحلقة للمشاهدة' : 'Select Episode'}
                </h3>
              </div>
              <button 
                onClick={() => setShowEpisodeDrawer(false)}
                className="text-xs text-white/50 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-bold"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5 overflow-y-auto pr-1 pb-4">
              {episodes.map((ep) => {
                const isLocked = ep.episodeNumber > 2 && !unlockedEpisodes.includes(ep.id);
                const isSelected = activeEpisodeId === ep.id;

                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      scrollToEpisode(ep.id);
                      setShowEpisodeDrawer(false);
                    }}
                    className={`py-3 px-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-bold transition-all relative ${
                      isSelected
                        ? 'bg-red-600 text-white border-2 border-white shadow-lg shadow-red-600/30 scale-105'
                        : isLocked
                        ? 'bg-[#1A1A1A] text-white/40 border border-white/5'
                        : 'bg-[#222222] text-white/90 hover:bg-[#333] border border-white/10'
                    }`}
                  >
                    <span className="text-xs">{isArabic ? `حلقة ${ep.episodeNumber}` : `Ep ${ep.episodeNumber}`}</span>
                    {isLocked && <span className="text-[10px]">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
              <span className="text-2xl text-yellow-500 font-black">50</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isArabic ? 'فتح الحلقة' : 'Unlock Episode'}
            </h3>
            <p className="text-white/60 text-xs mb-6">
              {isArabic 
                ? `تكلفة فتح هذه الحلقة هي 50 نقطة. رصيدك الحالي: ${coins} نقطة.` 
                : `This episode costs 50 coins. Your balance: ${coins} coins.`}
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowUnlockModal(null)}
                className="flex-1 py-3 rounded-full bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  if (spendCoins(50)) {
                    unlockEpisode(showUnlockModal);
                    setShowUnlockModal(null);
                  } else {
                    setShowUnlockModal(null);
                    setShowReferralModal(true);
                  }
                }}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs hover:from-red-500 hover:to-orange-400 transition-colors shadow-lg"
              >
                {isArabic ? 'فتح الآن' : 'Unlock Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Hub Modal */}
      <ReferralHub 
        isOpen={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
      />
    </div>
  );
};

