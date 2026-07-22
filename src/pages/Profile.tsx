import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Clock, Film, Tv, Flame, Gift, Settings, Crown, Share2, Wallet, User, Users, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { ReferralHub } from '../components/ReferralHub';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const { favorites, coins, watchedHours, moviesCount, seriesCount, streakDays, claimDailyReward, claimAdReward, premiumUntil, setPremiumUntil } = useAppStore();
  
  const [tgUser, setTgUser] = useState<any>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  
  const isPremium = premiumUntil ? premiumUntil > Date.now() : false;

  useEffect(() => {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setTgUser(window.Telegram.WebApp.initDataUnsafe.user);
    }
  }, []);

  const user = {
    name: tgUser?.first_name || 'Drama Fan',
    username: tgUser?.username ? `@${tgUser.username}` : '@dramafan',
    photoUrl: tgUser?.photo_url || null,
    watchedHours: watchedHours || 0,
    moviesCount: moviesCount || 0,
    seriesCount: seriesCount || 0,
    favoritesCount: favorites?.length || 0,
    streakDays: streakDays || 0,
    coins: coins || 0,
    subscription: isPremium ? 'premium' : 'free'
  };

  const handleSubscribe = async (days: number, amount: number) => {
    if (!userAddress) {
      tonConnectUI.openModal();
      return;
    }
    
    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: "0QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE9X",
            amount: (amount * 1000000000).toString(),
          }
        ]
      };

      await tonConnectUI.sendTransaction(transaction);
      
      const newPremiumUntil = Date.now() + (days * 24 * 60 * 60 * 1000);
      setPremiumUntil(newPremiumUntil);
      
      alert(t('subscriptionSuccess', 'Successfully subscribed for {{days}} days!', { days }));
    } catch (error) {
      console.error('Subscription error:', error);
      alert(t('transactionFailed', 'Transaction failed or canceled.'));
    }
  };

  return (
    <div className="h-full w-full min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col relative" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex-none bg-[#1A1A1A] px-4 py-6 border-b border-white/10 rounded-b-3xl z-10 w-full">
        <div className="flex items-center justify-between mb-4">
          <div 
            onClick={() => setShowReferralModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600/30 to-yellow-500/20 px-3 py-1.5 rounded-full border border-amber-500/30 cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-yellow-400 font-black text-sm" dir="ltr">{user.coins}</span>
            <Gift size={14} className="text-yellow-400 animate-bounce" />
          </div>
          {tgUser?.username && ['sekanedr_is', 'ridha1993', 'Ridha1993'].some(u => u.toLowerCase() === tgUser.username.toLowerCase()) && (
            <button 
              onClick={() => navigate('/admin')}
              className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center border border-white/10 active:opacity-70 transition-opacity"
            >
              <Settings size={18} className="text-white/80" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-black/50 border-2 border-red-600/50 flex items-center justify-center overflow-hidden relative flex-none">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-white/50" />
            )}
            {isPremium && (
              <div className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[8px] font-black text-center py-0.5 uppercase">
                PRO
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate text-start">{user.name}</h2>
            <p className="text-xs text-white/50 truncate text-start" dir="ltr">{user.username}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-y-auto p-4 flex flex-col gap-6 pb-24">
        
        {/* Referral System Highlight Banner */}
        <div 
          onClick={() => setShowReferralModal(true)}
          className="bg-gradient-to-r from-amber-950 via-yellow-900/80 to-[#181818] border border-amber-500/40 rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-xl shadow-amber-500/10 active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center text-black font-black shadow-lg">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-white">
                  {isArabic ? 'دعوة الأصدقاء وكسب النقاط' : 'Invite Friends & Earn Coins'}
                </h3>
                <Sparkles size={14} className="text-yellow-400 animate-pulse" />
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                {isArabic ? 'احصل على +250 نقطة لكل إحالة ناجحة' : 'Get +250 coins for every friend invited'}
              </p>
            </div>
          </div>
          <button className="px-3 py-2 bg-yellow-500 text-black font-black text-xs rounded-xl shadow-md whitespace-nowrap">
            {isArabic ? 'دعوة الآن' : 'Invite Now'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5">
            <Clock size={18} className="text-red-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.watchedHours}h</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('watched', 'Watched')}</div>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5">
            <Flame size={18} className="text-orange-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.streakDays}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('streak', 'Streak')}</div>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5">
            <Film size={18} className="text-blue-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.moviesCount}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('movies', 'Movies')}</div>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5">
            <Tv size={18} className="text-purple-500" />
            <div className="text-lg font-black text-white leading-none" dir="ltr">{user.seriesCount}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold text-center">{t('series', 'Series')}</div>
          </div>
        </div>

        {/* Earn Coins */}
        <div className="w-full">
          <h3 className="text-xs text-white/50 font-bold mb-3 uppercase tracking-wider text-start px-1">{t('earnCoins', 'Earn Coins')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={() => {
                if (claimDailyReward()) {
                  alert(t('dailyRewardClaimed', 'Daily Reward Claimed! +50 Coins'));
                } else {
                  alert(t('dailyRewardAlreadyClaimed', 'You already claimed your daily reward. Come back tomorrow!'));
                }
              }}
              className="bg-[#1A1A1A] border border-yellow-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-none">
                  <Gift className="text-yellow-500" size={16} />
                </div>
                <span className="font-bold text-sm text-white">{t('dailyReward', 'Daily Reward')}</span>
              </div>
              <span className="text-xs text-yellow-500 font-black bg-yellow-500/10 px-2 py-1 rounded-md" dir="ltr">+50</span>
            </button>
            <button 
              onClick={() => {
                if (claimAdReward()) {
                  alert(t('adRewardClaimed', 'Thanks for watching! +20 Coins'));
                } else {
                  alert(t('adRewardCooldown', 'Please wait 5 minutes before watching another ad.'));
                }
              }}
              className="bg-[#1A1A1A] border border-green-500/20 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-none">
                  <Film className="text-green-500" size={16} />
                </div>
                <span className="font-bold text-sm text-white">{t('watchAd', 'Watch Ad')}</span>
              </div>
              <span className="text-xs text-green-500 font-black bg-green-500/10 px-2 py-1 rounded-md" dir="ltr">+20</span>
            </button>
          </div>
        </div>

        {/* Premium Section */}
        <div className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
            <h3 className="text-xs text-white/50 font-bold uppercase tracking-wider flex items-center gap-2">
              <Crown className="text-yellow-500" size={14} />
              {t('premiumSubscription', 'Premium (Ad-Free)')}
            </h3>
            <div className="scale-75 origin-right">
              <TonConnectButton />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => handleSubscribe(1, 0.5)}
              className="bg-[#111111] border border-white/5 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 active:opacity-70 transition-opacity"
            >
              <Wallet className="text-blue-500" size={20} />
              <span className="font-bold text-xs sm:text-sm text-white text-center leading-tight">{t('1DayPlan', '1 Day')}</span>
              <span className="text-[10px] sm:text-xs text-blue-400 font-bold bg-blue-500/20 px-2 py-1 rounded-md w-full text-center whitespace-nowrap" dir="ltr">0.5 TON</span>
            </button>
            <button 
              onClick={() => handleSubscribe(7, 2)}
              className="bg-[#111111] border border-yellow-500/30 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden active:opacity-70 transition-opacity"
            >
              <div className="absolute top-0 inset-x-0 bg-red-600 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest w-full">
                Popular
              </div>
              <Wallet className="text-yellow-500 mt-2" size={20} />
              <span className="font-bold text-xs sm:text-sm text-white text-center leading-tight">{t('7DaysPlan', '7 Days')}</span>
              <span className="text-[10px] sm:text-xs text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded-md w-full text-center whitespace-nowrap" dir="ltr">2 TON</span>
            </button>
            <button 
              onClick={() => handleSubscribe(30, 8)}
              className="bg-[#111111] border border-green-500/30 p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden active:opacity-70 transition-opacity"
            >
              <div className="absolute top-0 inset-x-0 bg-green-600 text-white text-[8px] font-black text-center py-0.5 uppercase tracking-widest w-full">
                Best Value
              </div>
              <Wallet className="text-green-500 mt-2" size={20} />
              <span className="font-bold text-xs sm:text-sm text-white text-center leading-tight">{t('30DaysPlan', '30 Days')}</span>
              <span className="text-[10px] sm:text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-md w-full text-center whitespace-nowrap" dir="ltr">8 TON</span>
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="w-full">
           <h3 className="text-xs text-white/50 font-bold mb-3 uppercase tracking-wider text-start px-1">{t('settings', 'Settings')}</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')}
                className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-none">
                    <Settings className="text-indigo-400" size={16} />
                  </div>
                  <span className="font-bold text-sm text-white">{t('changeLanguage', 'Language')}</span>
                </div>
                <span className="text-xs text-indigo-300 uppercase font-black bg-indigo-500/20 px-2 py-1 rounded-md" dir="ltr">{i18n.language.toUpperCase()}</span>
              </button>
              
              <button 
                onClick={() => setShowReferralModal(true)}
                className="bg-[#111111] border border-white/5 p-4 rounded-2xl flex items-center justify-between active:opacity-70 transition-opacity w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-none">
                    <Share2 className="text-blue-500" size={16} />
                  </div>
                  <span className="font-bold text-sm text-white">{t('inviteFriends', 'Invite')}</span>
                </div>
                <span className="text-xs text-yellow-500 font-black bg-yellow-500/10 px-2 py-1 rounded-md" dir="ltr">+250</span>
              </button>
           </div>
        </div>

      </div>

      <ReferralHub 
        isOpen={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
      />
    </div>
  );
};

