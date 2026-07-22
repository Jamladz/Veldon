import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query, where, orderBy, limit, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { ReferralRecord, ReferralMilestone } from '../types';

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  {
    id: 'm1',
    targetCount: 3,
    rewardCoins: 500,
    rewardVipDays: 1,
    titleAr: '3 إحالات: +500 نقطة + 1 يوم VIP',
    titleEn: '3 Referrals: +500 Coins + 1 Day VIP'
  },
  {
    id: 'm2',
    targetCount: 5,
    rewardCoins: 1000,
    rewardVipDays: 3,
    titleAr: '5 إحالات: +1000 نقطة + 3 أيام VIP',
    titleEn: '5 Referrals: +1000 Coins + 3 Days VIP'
  },
  {
    id: 'm3',
    targetCount: 10,
    rewardCoins: 2500,
    rewardVipDays: 7,
    titleAr: '10 إحالات: +2500 نقطة + 7 أيام VIP',
    titleEn: '10 Referrals: +2500 Coins + 7 Days VIP'
  },
  {
    id: 'm4',
    targetCount: 25,
    rewardCoins: 7000,
    rewardVipDays: 30,
    titleAr: '25 إحالة: +7000 نقطة + 30 يوم VIP',
    titleEn: '25 Referrals: +7000 Coins + 30 Days VIP'
  }
];

export function getTelegramUser() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

export function getCurrentUserId(authUid?: string): string {
  const tgUser = getTelegramUser();
  if (tgUser && tgUser.id) {
    return `tg_${tgUser.id}`;
  }
  if (authUid) {
    return authUid;
  }
  let localId = localStorage.getItem('dramareel_user_id');
  if (!localId) {
    localId = `usr_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('dramareel_user_id', localId);
  }
  return localId;
}

export function getReferralLink(userId: string): string {
  const botUsername = 'DramaReel_bot';
  // Standard Telegram Mini App deep link format
  return `https://t.me/${botUsername}?startapp=ref_${userId}`;
}

export function getShareTelegramLink(userId: string, isArabic = true): string {
  const refLink = getReferralLink(userId);
  const text = isArabic
    ? encodeURIComponent(`🎬 شاهد أفضل الأفلام والمسلسلات مجاناً على Drama Reel! \n🎁 استخدم الرابط الخاص بي واحصل على 100 نقطة مجانية فوراً:\n${refLink}`)
    : encodeURIComponent(`🎬 Watch the best movies and dramas for free on Drama Reel! \n🎁 Join via my link to get 100 bonus coins instantly:\n${refLink}`);
  return `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${text}`;
}

export async function processReferral(currentUserId: string, currentUserName: string): Promise<{ success: boolean; bonusCoins: number } | null> {
  try {
    let rawRef: string | null = null;
    
    // Check Telegram WebApp start_param
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
      rawRef = window.Telegram.WebApp.initDataUnsafe.start_param;
    }
    
    // Check URL query search parameters fallback
    if (!rawRef && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      rawRef = urlParams.get('startapp') || urlParams.get('ref') || urlParams.get('start');
    }

    if (!rawRef) return null;

    // Clean prefix 'ref_'
    const referrerId = rawRef.startsWith('ref_') ? rawRef.replace('ref_', '') : rawRef;

    if (!referrerId || referrerId === currentUserId) {
      return null; // Self-referral or invalid
    }

    const userRef = doc(db, 'users', currentUserId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data()?.referredBy) {
      return null; // Already referred before
    }

    // Process atomically
    const WELCOME_BONUS = 100;
    const REFERRER_REWARD = 250;

    await runTransaction(db, async (transaction) => {
      const referrerRef = doc(db, 'users', referrerId);
      const referrerDoc = await transaction.get(referrerRef);

      // 1. Update current user
      if (userDoc.exists()) {
        transaction.update(userRef, {
          referredBy: referrerId,
          coins: increment(WELCOME_BONUS)
        });
      } else {
        transaction.set(userRef, {
          id: currentUserId,
          name: currentUserName || 'User',
          coins: WELCOME_BONUS,
          referredBy: referrerId,
          referralsCount: 0,
          earnedReferralCoins: 0,
          claimedMilestones: [],
          createdAt: Date.now()
        });
      }

      // 2. Update referrer if exists or create record
      if (referrerDoc.exists()) {
        transaction.update(referrerRef, {
          coins: increment(REFERRER_REWARD),
          referralsCount: increment(1),
          earnedReferralCoins: increment(REFERRER_REWARD)
        });
      } else {
        transaction.set(referrerRef, {
          id: referrerId,
          coins: REFERRER_REWARD,
          referralsCount: 1,
          earnedReferralCoins: REFERRER_REWARD,
          claimedMilestones: [],
          createdAt: Date.now()
        });
      }

      // 3. Log referral record
      const refRecordRef = doc(collection(db, 'referrals'));
      transaction.set(refRecordRef, {
        id: refRecordRef.id,
        referrerId: referrerId,
        referredId: currentUserId,
        referredName: currentUserName || 'Friend',
        rewardCoins: REFERRER_REWARD,
        createdAt: Date.now()
      });
    });

    return { success: true, bonusCoins: WELCOME_BONUS };
  } catch (error) {
    console.error('Error processing referral:', error);
    return null;
  }
}

export async function getUserReferrals(userId: string): Promise<ReferralRecord[]> {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as ReferralRecord);
  } catch (error) {
    console.error('Error getting user referrals:', error);
    return [];
  }
}

export async function syncUserData(userId: string, initialCoins: number) {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: userId,
        coins: initialCoins,
        referralsCount: 0,
        earnedReferralCoins: 0,
        claimedMilestones: [],
        createdAt: Date.now()
      });
      return { coins: initialCoins, referralsCount: 0, earnedReferralCoins: 0, claimedMilestones: [] };
    } else {
      return snap.data();
    }
  } catch (error) {
    console.error('Error syncing user data:', error);
    return null;
  }
}
