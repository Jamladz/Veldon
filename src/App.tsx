import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

// Components
import { BottomNav } from './components/BottomNav';

// Pages
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Favorites } from './pages/Favorites';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { MovieDetails } from './pages/MovieDetails';
import { Watch } from './pages/Watch';
import { Admin } from './pages/Admin';
import { ForYou } from './pages/ForYou';

// Initialization
import './i18n';

// Main App component
const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Don't show bottom nav on watch page or details or admin
  const showNav = !location.pathname.includes('/watch/') && !location.pathname.includes('/movie/') && !location.pathname.includes('/admin');

  return (
    <div className="bg-[#050505] h-screen w-screen overflow-hidden text-[#E0E0E0] font-sans selection:bg-red-500/30 relative flex flex-col">
      <div className="flex-1 w-full min-h-0 overflow-hidden relative">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/foryou" element={<ForYou />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </div>
  );
};

export default function App() {
  const [isAuthReady, setIsAuthReady] = React.useState(false);

  useEffect(() => {
    // Set theme based on Telegram settings or force dark
    document.documentElement.classList.add('dark');
    
    // Telegram Web App configurations
    if ((window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.expand();
      try {
        if (tg.setHeaderColor) tg.setHeaderColor('#050505');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#050505');
      } catch (e) {
        console.error("Telegram set color error:", e);
      }
    }
    
    signInAnonymously(auth).catch(console.error);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isAuthReady) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-600">Loading...</div>;
  }

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
