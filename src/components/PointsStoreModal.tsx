import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Crown, Sparkles, Coins, CheckCircle2, Zap, Gift, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store';

interface PointsStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTonModal?: () => void;
}

export const POINTS_VIP_PACKAGES = [
  {
    id: 'points-1day',
    days: 1,
    cost: 1200,
    titleAr: 'اشتراك يوم واحد VIP',
    titleEn: '1-Day VIP Pass',
    badgeAr: 'يوم مجاني بنقاطك',
    badgeEn: '1 Day Pass',
    popular: false,
  },
  {
    id: 'points-3days',
    days: 3,
    cost: 3000,
    titleAr: 'اشتراك 3 أيام VIP',
    titleEn: '3-Days VIP Pass',
    badgeAr: 'توفير جيد',
    badgeEn: 'Popular',
    popular: false,
  },
  {
    id: 'points-7days',
    days: 7,
    cost: 5000,
    titleAr: 'اشتراك 7 أيام VIP',
    titleEn: '7-Days VIP Pass',
    badgeAr: 'الأكثر طلباً ⭐',
    badgeEn: 'Best Seller ⭐',
    popular: true,
  },
  {
    id: 'points-month',
    days: 30,
    cost: 16000,
    titleAr: 'اشتراك شهر كامل (30 يوم)',
    titleEn: '1-Month VIP Pass (30 Days)',
    badgeAr: 'توفير ضخم 🔥',
    badgeEn: 'Huge Savings 🔥',
    popular: false,
  }
];

export const PointsStoreModal: React.FC<PointsStoreModalProps> = ({ isOpen, onClose, onOpenTonModal }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const { coins, buyPointsVipPass, isVipActive, isPaidVip, isPointsVip, premiumUntil } = useAppStore();
  const [selectedPkgId, setSelectedPkgId] = useState<string>('points-7days');
  const [msg, setMsg] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const selectedPkg = POINTS_VIP_PACKAGES.find(p => p.id === selectedPkgId) || POINTS_VIP_PACKAGES[0];

  const handleRedeem = () => {
    setMsg(null);
    if (coins < selectedPkg.cost) {
      setMsg({
        text: isArabic 
          ? `رصيد نقاطك الحالي (${coins}) لا يكفي. تحتاج إلى ${selectedPkg.cost} نقطة. دع الأصدقاء لكسب المزيد من النقاط!`
          : `Insufficient balance (${coins} coins). You need ${selectedPkg.cost} coins. Invite friends to earn more!`,
        success: false
      });
      return;
    }

    const success = buyPointsVipPass(selectedPkg.days, selectedPkg.cost);
    if (success) {
      setMsg({
        text: isArabic 
          ? `🎉 تم تفعيل اشتراك VIP بالنقاط لمدة ${selectedPkg.days} يوم بنجاح! ستشاهد الآن إعلان واحد فقط كل 6 فيديوهات.`
          : `🎉 Successfully activated ${selectedPkg.days}-day VIP Pass! You will now see only 1 ad every 6 videos.`,
        success: true
      });
    } else {
      setMsg({
        text: isArabic ? 'حدث خطأ أثناء استبدال النقاط' : 'Failed to redeem points',
        success: false
      });
    }
  };

  const formattedExpiry = premiumUntil ? new Date(premiumUntil).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US') : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        className="bg-[#12110F] border border-amber-500/40 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.25)] animate-in slide-in-from-bottom duration-300"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-yellow-900/80 to-[#12110F] p-5 border-b border-amber-500/20 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 text-black font-black">
              <Crown size={26} className="fill-black" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                {isArabic ? 'متجر باقات VIP بالنقاط' : 'Points VIP Store'}
                <Sparkles size={16} className="text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-xs text-amber-200/80">
                {isArabic ? 'استبدل أرباحك ونقاطك باشتراكات VIP' : 'Redeem your points balance for VIP Passes'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">

          {/* Current Points Balance Box */}
          <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-[#1A1815] border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-black shadow-md">
                <Coins size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-300/80 uppercase">
                  {isArabic ? 'مجموع رصيد نقاطك الشامل' : 'Total Points Balance'}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white" dir="ltr">{coins.toLocaleString()}</span>
                  <span className="text-xs font-black text-yellow-400">{isArabic ? 'نقطة' : 'coins'}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
                {isArabic ? 'جاهز للاستخدام' : 'Ready to use'}
              </span>
            </div>
          </div>

          {/* Current VIP Status Notification if active */}
          {isVipActive() && (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-bold ${
              isPaidVip()
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <Crown size={20} className="shrink-0" />
              <div>
                <span>
                  {isPaidVip()
                    ? (isArabic ? 'اشتراكك الحالي: VIP مدفوع (بدون إعلانات تماماً 🚀)' : 'Active: Paid VIP (100% Ad-Free 🚀)')
                    : (isArabic ? 'اشتراكك الحالي: VIP بالنقاط (إعلان كل 6 فيديوهات 🎬)' : 'Active: Points VIP (1 ad per 6 videos 🎬)')
                  }
                </span>
                {formattedExpiry && (
                  <p className="text-[10px] opacity-80 mt-0.5" dir={isArabic ? 'rtl' : 'ltr'}>
                    {isArabic ? `تنتهي الصلاحية في: ${formattedExpiry}` : `Expires on: ${formattedExpiry}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Difference Notice: Points VIP vs Paid VIP */}
          <div className="bg-[#181613] border border-amber-500/20 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
              <Zap size={15} />
              <span>{isArabic ? 'مميزات VIP بالنقاط مقابل VIP المدفوع:' : 'Points VIP vs Paid VIP:'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-black/40 p-2.5 rounded-xl border border-amber-500/10">
                <span className="font-black text-amber-300 block mb-0.5">
                  {isArabic ? '⭐ VIP بالنقاط' : '⭐ Points VIP'}
                </span>
                <span className="text-white/70">
                  {isArabic ? 'تستمتع بمشاهدة إعلان 1 فقط كل 6 فيديوهات بدلاً من فيديوهين' : '1 ad every 6 videos instead of every 2'}
                </span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-blue-500/20">
                <span className="font-black text-blue-400 block mb-0.5">
                  {isArabic ? '🚀 VIP مدفوع (TON)' : '🚀 Paid VIP (TON)'}
                </span>
                <span className="text-white/70">
                  {isArabic ? 'مشاهدة غير محدودة وبدون إعلانات تماماً (0 إعلانات)' : 'Unlimited watching with zero ads (100% Ad-Free)'}
                </span>
              </div>
            </div>
          </div>

          {/* Packages List */}
          <div>
            <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3 flex items-center justify-between">
              <span>{isArabic ? 'اختر باقة VIP بالنقاط:' : 'Select Points VIP Package:'}</span>
            </h3>

            <div className="space-y-3">
              {POINTS_VIP_PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                const canAfford = coins >= pkg.cost;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex items-center justify-between ${
                      isSelected 
                        ? 'bg-gradient-to-r from-amber-950/70 via-yellow-950/40 to-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
                        : 'bg-[#181818] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-black text-[9px] font-black px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
                        {isArabic ? pkg.badgeAr : pkg.badgeEn}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-400' : 'border-white/30'
                      }`}>
                        {isSelected && <CheckCircle2 size={12} className="text-black font-bold" />}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-white">
                          {isArabic ? pkg.titleAr : pkg.titleEn}
                        </h4>
                        <p className="text-[11px] text-amber-200/80 font-medium">
                          {isArabic 
                            ? `إعلان 1 فقط كل 6 فيديوهات لمدة ${pkg.days} ${pkg.days === 1 ? 'يوم' : 'أيام'}` 
                            : `1 ad every 6 videos for ${pkg.days} days`}
                        </p>
                      </div>
                    </div>

                    <div className="text-left" dir="ltr">
                      <span className={`text-sm font-black font-mono ${canAfford ? 'text-yellow-400' : 'text-white/40'}`}>
                        {pkg.cost.toLocaleString()} {isArabic ? 'نقطة' : 'pts'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Message */}
          {msg && (
            <div className={`p-3.5 rounded-2xl border text-xs font-bold text-center ${
              msg.success 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}>
              {msg.text}
            </div>
          )}

          {/* Paid VIP Shortcut Link */}
          {onOpenTonModal && (
            <div 
              onClick={() => {
                onClose();
                onOpenTonModal();
              }}
              className="p-3 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    {isArabic ? 'هل تريد مشاهدة بدون إعلانات تماماً؟' : 'Want 100% Zero Ads?'}
                  </h4>
                  <p className="text-[10px] text-blue-200/80">
                    {isArabic ? 'انقر للاشتراك المدفوع عبر TON (بدون إعلانات)' : 'Click for Paid Subscriptions via TON'}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className={`text-blue-400 ${isArabic ? 'rotate-180' : ''}`} />
            </div>
          )}

        </div>

        {/* Footer Action */}
        <div className="p-5 border-t border-white/10 bg-[#0D0D0D]">
          <button
            onClick={handleRedeem}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black py-3.5 px-6 rounded-2xl shadow-[0_4px_25px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Gift size={18} />
            <span>
              {isArabic 
                ? `استبدال ${selectedPkg.cost.toLocaleString()} نقطة مقابل VIP (${selectedPkg.days} يوم)` 
                : `Redeem ${selectedPkg.cost.toLocaleString()} pts for ${selectedPkg.days}-Day VIP`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
