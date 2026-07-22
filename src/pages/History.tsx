import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Play } from 'lucide-react';

export const History = () => {
  const { t } = useTranslation();
  const { movies, history } = useAppStore();
  const navigate = useNavigate();

  const historyItems = Object.values(history)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(h => ({
      ...h,
      movie: movies.find(m => m.id === h.movieId)!
    }))
    .filter(h => h.movie);

  return (
    <div className="h-full w-full overflow-hidden bg-[#050505] flex flex-col p-6">
      <h1 className="flex-none text-2xl font-black text-white mb-6 uppercase tracking-tighter">{t('history')}</h1>
      
      <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        {historyItems.length > 0 ? (
          <div className="space-y-4">
            {historyItems.map(({ movie, percentage }) => (
              <div 
                key={movie.id} 
                onClick={() => navigate(`/watch/${movie.id}`)}
                className="flex gap-4 bg-[#1A1A1A] rounded-2xl overflow-hidden cursor-pointer active:opacity-80 transition-all p-3 border border-white/5 hover:border-white/20"
              >
                <div className="w-32 aspect-video rounded-xl overflow-hidden relative flex-shrink-0 bg-black">
                  <img src={movie.coverImage} alt={movie.title} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play size={24} className="text-white" fill="currentColor" />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1 truncate">{movie.title}</h3>
                  <p className="text-[10px] text-white/40 mb-3 uppercase tracking-widest">{t('episodes', 'Episode')} 1</p>
                  <div className="flex items-center gap-3">
                    <div className="w-full h-1 bg-[#050505] rounded-full overflow-hidden flex-1">
                      <div 
                        className="h-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(229,9,20,0.5)]" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-red-500 font-bold">{Math.round(percentage)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-500 h-full space-y-4">
            <Play size={48} className="opacity-20" />
            <p>{t('noHistory', 'No watch history.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
