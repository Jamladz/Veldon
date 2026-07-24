import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Heart, Share2, MessageCircle, Bookmark, Layers, Gift, Plus, Zap, Sparkles, Crown, Tv } from 'lucide-react';
import { useAppStore } from '../store';
import { ReelPlayer } from '../components/ReelPlayer';
import { ReferralHub } from '../components/ReferralHub';
import { TonPaymentModal } from '../components/TonPaymentModal';
import { showAdsgramAd, ADSGRAM_BLOCKS } from '../services/adsgramService';

export const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const { movies, toggleFavorite, favorites, unlockedEpisodes, spendCoins, unlockEpisode, coins, isVipActive, updateHistory } = useAppStore();
  const isVip = isVipActive();
  
  const movie = useMemo(() => movies.find(m => m.id === id), [movies, id]);
  const isFav = movie ? favorites.includes(movie.id) : false;

  const [showUnlockModal, setShowUnlockModal] = useState<string | null>(null);
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showTonModal, setShowTonModal] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  const handleUnlockWithAdsgram = async (epId: string) => {
    const currentEp = episodes.find(e => e.id === epId);
    if (!currentEp) return;

    setIsAdLoading(true);
    const success = await showAdsgramAd(ADSGRAM_BLOCKS.EPISODE_REWARD);
    setIsAdLoading(false);

    if (success) {
      // Unlock this episode
      unlockEpisode(epId);

      // Unlock pair episode (e.g. if ep 7 -> unlock ep 8 as well; if ep 8 -> unlock ep 7)
      const pairEpNum = currentEp.episodeNumber % 2 === 1 
        ? currentEp.episodeNumber + 1 
        : currentEp.episodeNumber - 1;
      
      const pairEp = episodes.find(e => e.episodeNumber === pairEpNum);
      if (pairEp) {
        unlockEpisode(pairEp.id);
      }

      setShowUnlockModal(null);
    }
  };

  // Auto-hiding controls timer (4 seconds of no touch)
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = () => {
    setAreControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setAreControlsVisible(false);
    }, 4000);
  };

  const handleScreenTouch = () => {
    resetControlsTimer();
  };

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

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

  // Sync Watch History with exact episode, percentage, and timestamp
  useEffect(() => {
    if (movie && activeEpisodeId) {
      const currentEp = episodes.find(e => e.id === activeEpisodeId) || episodes[0];
      if (currentEp) {
        const pct = Math.min(100, Math.round((currentEp.episodeNumber / episodes.length) * 100));
        updateHistory(movie.id, {
          movieId: movie.id,
          episodeId: currentEp.id,
          episodeNumber: currentEp.episodeNumber,
          lastWatchedMinute: currentEp.episodeNumber,
          updatedAt: Date.now(),
          percentage: pct
        });
      }
    }
  }, [movie, activeEpisodeId, episodes, updateHistory]);

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

  // Precise height-based calculation on scroll for instant active episode switching
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const height = container.clientHeight;
    if (height <= 0) return;
    const index = Math.round(container.scrollTop / height);
    if (episodes[index] && episodes[index].id !== activeEpisodeId) {
      setActiveEpisodeId(episodes[index].id);
    }
  };

  // Backup IntersectionObserver for snap scroll completion
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
    <div 
      onClick={handleScreenTouch}
      onTouchStart={handleScreenTouch}
      className="bg-black fixed inset-0 z-50 flex flex-col select-none" 
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top Header overlay */}
      <div className={`absolute top-0 left-0 right-0 p-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between z-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-all duration-500 ${
        areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
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

        {/* Right Header Buttons: TON Payment & Referral */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* TON Payment Button */}
          <button 
            onClick={() => setShowTonModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0098EA] to-blue-600 rounded-full text-white font-extrabold text-xs shadow-lg shadow-[#0098EA]/30 border border-[#0098EA]/40 active:scale-95 transition-transform"
          >
            <Zap size={14} className="text-yellow-300 animate-pulse" />
            <span>{isArabic ? 'عملة TON' : 'TON Pay'}</span>
          </button>

          {/* Earn Coins / Refer Button */}
          <button 
            onClick={() => setShowReferralModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 border border-yellow-400/30 active:scale-95 transition-transform"
          >
            <Gift size={14} className="animate-bounce" />
            <span>+250</span>
          </button>
        </div>
      </div>

      {/* Vertical Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar touch-pan-y"
        style={{ scrollBehavior: 'smooth' }}
      >
        {episodes.map((ep, idx) => {
          const isLocked = !isVip && ep.episodeNumber > 6 && !unlockedEpisodes.includes(ep.id);
          const isCurrentActive = activeEpisodeId === ep.id;

          return (
            <div 
              key={ep.id} 
              data-episode-id={ep.id}
              className="reel-item relative w-full h-full snap-start snap-always touch-pan-y"
            >
              {isLocked ? (
                <div className="absolute inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-10 px-6 text-center">
                  <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mb-4 border border-red-500/30 shadow-lg shadow-red-600/20">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">
                    {isArabic ? `الحلقة ${ep.episodeNumber} مغلقة` : `Episode ${ep.episodeNumber} Locked`}
                  </h3>
                  <p className="text-white/60 text-xs mb-6 max-w-xs leading-relaxed">
                    {isArabic 
                      ? 'الحلقات من 1 إلى 6 مجانية بالكامل! شاهد إعلان قصير لفتح هذه الحلقة والحلقة التالية معاً.' 
                      : 'Episodes 1-6 are free! Watch a short ad to unlock 2 episodes.'}
                  </p>
                  <button 
                    onClick={() => setShowUnlockModal(ep.id)}
                    className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black py-3.5 px-8 rounded-2xl shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-95 transition-all text-xs flex items-center gap-2"
                  >
                    <Tv size={16} />
                    <span>{isArabic ? 'فتح بإعلان قصير' : 'Unlock with Short Ad'}</span>
                  </button>
                </div>
              ) : (
                <ReelPlayer 
                  url={ep.videoUrl} 
                  isActive={isCurrentActive}
                  duration={ep.duration}
                  onComplete={() => {
                    useAppStore.getState().completeEpisode(ep.id);
                    // Smooth auto-scroll to next episode if available
                    if (idx + 1 < episodes.length) {
                      setTimeout(() => {
                        scrollToEpisode(episodes[idx + 1].id);
                      }, 300);
                    }
                  }}
                />
              )}

              {/* Right Side Action Buttons */}
              <div className={`absolute right-3.5 bottom-20 flex flex-col items-center gap-4 z-20 transition-all duration-500 ${
                areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}>
                {/* Series Avatar with Follow Badge */}
                <div className="relative mb-1 group cursor-pointer" onClick={() => setShowEpisodeDrawer(true)}>
                  <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 shadow-xl shadow-red-600/20 group-active:scale-95 transition-transform">
                    <img 
                      src={movie.coverImage} 
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
                
                {/* Episodes Drawer Button */}
                <button 
                  onClick={() => setShowEpisodeDrawer(true)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 bg-black/45 backdrop-blur-xl rounded-full flex items-center justify-center text-red-400 border border-white/15 group-active:scale-90 transition-all shadow-lg hover:border-white/30">
                    <Layers size={22} className="text-red-500" />
                  </div>
                  <span className="text-white text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {isArabic ? 'الحلقات' : 'Episodes'}
                  </span>
                </button>

                {/* Referral / Share Button with Coin Badge */}
                <button 
                  onClick={() => setShowReferralModal(true)}
                  className="flex flex-col items-center gap-1 group relative"
                >
                  <div className="w-12 h-12 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-500/25 border border-amber-300/30 group-active:scale-90 transition-all">
                    <Share2 size={22} />
                  </div>
                  <span className="text-amber-400 text-[11px] font-extrabold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {isArabic ? '+50 نقطة' : '+50 Coins'}
                  </span>
                </button>
              </div>

              {/* Bottom Episode Info & Details Overlay */}
              <div className={`absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-500 ${
                areControlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}>
                <div className="pointer-events-auto space-y-1.5">
                  {/* Series Title & Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-md border border-red-400/30">
                      {isArabic ? `الحلقة ${ep.episodeNumber}` : `Ep ${ep.episodeNumber}`}
                    </span>
                    <span className="px-2 py-0.5 bg-white/15 text-white/90 text-[10px] font-bold rounded-full backdrop-blur-md border border-white/10">
                      HD 1080p
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full backdrop-blur-md border border-amber-500/30 flex items-center gap-1">
                      ★ {movie.rating}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-extrabold text-base tracking-tight drop-shadow-lg truncate max-w-[260px]">
                    {movie.title} - {ep.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/80 text-xs line-clamp-2 leading-relaxed drop-shadow-md">
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
                const isLocked = !isVip && ep.episodeNumber > 6 && !unlockedEpisodes.includes(ep.id);
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

      {/* Unlock Modal with Adsgram & VIP options */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-amber-500/30 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-md flex items-center gap-1">
              <Sparkles size={12} className="fill-black" />
              <span>{isArabic ? 'الحلقات 1 إلى 6 مجانية بالكامل!' : 'Episodes 1-6 are 100% Free!'}</span>
            </div>

            <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-orange-500 rounded-2xl flex items-center justify-center mb-3 text-white shadow-lg shadow-red-600/30">
              <Tv size={28} />
            </div>

            <h3 className="text-lg font-black text-white mb-1">
              {isArabic ? 'مشاهدة إعلان قصير لفتح حلقتين' : 'Watch Short Ad to Unlock 2 Episodes'}
            </h3>
            
            <p className="text-white/60 text-xs mb-5 leading-relaxed">
              {isArabic 
                ? 'شاهد إعلان قصير لتمرير هذه الحلقة والحلقة التالية مجاناً، أو اشترك في VIP لمشاهدة جميع الحلقات بلا إعلانات.' 
                : 'Watch a quick ad to unlock this episode & the next one free, or activate VIP for zero ads.'}
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              {/* Option 1: Watch Ad */}
              <button 
                onClick={() => handleUnlockWithAdsgram(showUnlockModal)}
                disabled={isAdLoading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-xs shadow-lg shadow-red-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdLoading ? (
                  <span>{isArabic ? 'جاري تحميل الإعلان...' : 'Loading Ad...'}</span>
                ) : (
                  <>
                    <Tv size={16} />
                    <span>{isArabic ? 'مشاهدة إعلان (فتح حلقتين)' : 'Watch Short Ad (Unlock 2 Ep)'}</span>
                  </>
                )}
              </button>

              {/* Option 2: Coins Unlock if available */}
              {coins >= 50 && (
                <button 
                  onClick={() => {
                    if (spendCoins(50, isArabic ? 'فتح حلقة' : 'Unlock Episode')) {
                      unlockEpisode(showUnlockModal);
                      setShowUnlockModal(null);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-yellow-300 font-extrabold text-xs active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Gift size={16} />
                  <span>{isArabic ? 'فتح مقابل 50 نقطة' : 'Unlock for 50 Coins'}</span>
                </button>
              )}

              {/* Option 3: Activate VIP */}
              <button 
                onClick={() => {
                  setShowUnlockModal(null);
                  setShowTonModal(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Crown size={16} className="fill-black" />
                <span>{isArabic ? 'تفعيل اشتراك VIP (بدون إعلانات)' : 'Activate VIP Pass (No Ads)'}</span>
              </button>

              {/* Option 4: Close */}
              <button 
                onClick={() => setShowUnlockModal(null)}
                className="w-full py-2 rounded-xl text-white/50 text-xs hover:text-white transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
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

      {/* TON Crypto Payment Modal */}
      <TonPaymentModal 
        isOpen={showTonModal} 
        onClose={() => setShowTonModal(false)} 
      />
    </div>
  );
};

