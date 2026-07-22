import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Flame, Heart, PlayCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BottomNav = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: "/", icon: <Home size={24} />, label: t('home') },
    { to: "/foryou", icon: <Flame size={24} />, label: t('forYou', 'For You') },
    { to: "/favorites", icon: <Heart size={24} />, label: t('favorites') },
    { to: "/history", icon: <PlayCircle size={24} />, label: t('history') },
    { to: "/profile", icon: <User size={24} />, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1A1A] px-6 py-3 rounded-3xl border border-white/10 flex items-center gap-6 shadow-2xl z-50 whitespace-nowrap">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-red-600' : 'text-white/40 hover:text-white'
            }`
          }
        >
          {item.icon}
          <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
