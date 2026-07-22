import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Edit3, Image as ImageIcon, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchMoviesFromDB, addMovieToDB, deleteMovieFromDB, addEpisodeToMovieDB, deleteEpisodeFromMovieDB, updateMovieInDB } from '../services/movieService';
import { Movie, Episode } from '../types';
import { useAppStore } from '../store';

export const Admin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { movies, setMovies } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [expandedMovieId, setExpandedMovieId] = useState<string | null>(null);

  // Forms states
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [selectedMovieForEpisode, setSelectedMovieForEpisode] = useState<string | null>(null);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);

  const [newMovie, setNewMovie] = useState<Partial<Movie>>({
    title: '', description: '', coverImage: '', category: 'Drama', releaseYear: 2026, rating: 5.0, duration: 0, episodesCount: 0, views: 0, country: 'USA', language: 'Dubbed'
  });

  const [newEpisode, setNewEpisode] = useState<Partial<Episode>>({
    title: '', videoUrl: '', episodeNumber: 1, duration: 0
  });

  const [movieToDelete, setMovieToDelete] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const tg = (window as any).Telegram?.WebApp;
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (tg?.initDataUnsafe?.user) {
        const username = tg.initDataUnsafe.user.username;
        const ADMINS = ['sekanedr_is', 'ridha1993', 'Ridha1993'];
        if (!username || !ADMINS.some(admin => admin.toLowerCase() === username.toLowerCase())) {
          navigate('/');
          return false;
        }
      } else if (!isLocalHost) {
        navigate('/');
        return false;
      }
      return true;
    };

    if (checkAuth()) {
      loadMovies();
    }
  }, [navigate]);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const data = await fetchMoviesFromDB();
      setMovies(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddMovie = async () => {
    if (!newMovie.title || !newMovie.coverImage) return;
    
    if (editingMovieId) {
      const movie = movies.find(m => m.id === editingMovieId);
      if (movie) {
        const updatedMovie: Movie = {
          ...movie,
          ...(newMovie as Movie)
        };
        await updateMovieInDB(updatedMovie);
      }
    } else {
      const movie: Movie = {
        ...(newMovie as Movie),
        id: Date.now().toString(),
        episodes: [],
        createdAt: Date.now()
      };
      await addMovieToDB(movie);
    }
    
    setShowAddMovie(false);
    setEditingMovieId(null);
    setNewMovie({ title: '', description: '', coverImage: '', category: 'Drama', releaseYear: 2026, rating: 5.0, duration: 0, episodesCount: 0, views: 0, country: 'USA', language: 'Dubbed' });
    loadMovies();
  };

  const confirmDelete = async () => {
    if (movieToDelete) {
      await deleteMovieFromDB(movieToDelete);
      setMovieToDelete(null);
      loadMovies();
    }
  };

  const handleAddEpisode = async () => {
    if (!selectedMovieForEpisode || !newEpisode.title || !newEpisode.videoUrl) return;
    
    const movie = movies.find(m => m.id === selectedMovieForEpisode);
    if (!movie) return;

    if (editingEpisodeId) {
      const updatedEpisodes = (movie.episodes || []).map(ep => 
        ep.id === editingEpisodeId ? { ...ep, ...newEpisode } as Episode : ep
      );
      await updateMovieInDB({ ...movie, episodes: updatedEpisodes });
    } else {
      const ep: Episode = {
        ...(newEpisode as Episode),
        id: 'ep_' + Date.now().toString(),
      };
      await addEpisodeToMovieDB(selectedMovieForEpisode, ep);
    }
    
    setSelectedMovieForEpisode(null);
    setEditingEpisodeId(null);
    setNewEpisode({ title: '', videoUrl: '', episodeNumber: 1, duration: 0 });
    loadMovies();
  };

  const handleDeleteEpisode = async (movieId: string, episode: Episode) => {
    await deleteEpisodeFromMovieDB(movieId, episode);
    loadMovies();
  };

  return (
    <div className="bg-[#050505] h-full w-full overflow-hidden text-white flex flex-col">
      <div className="flex-none p-6 flex items-center gap-4 bg-[#1A1A1A] border-b border-white/5 z-50">
        <button onClick={() => navigate(-1)} className="text-white hover:text-red-500 transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest">{t('adminPanel', 'Admin Panel')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">{t('moviesManagement', 'Movies Management')}</h2>
          <button 
            onClick={() => {
              setEditingMovieId(null);
              setNewMovie({ title: '', description: '', coverImage: '', category: 'Drama', releaseYear: 2026, rating: 5.0, duration: 0, episodesCount: 0, views: 0, country: 'USA', language: 'Dubbed' });
              setShowAddMovie(!showAddMovie);
            }}
            className="bg-red-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={16} /> {t('addMovie', 'Add Movie')}
          </button>
        </div>

        {showAddMovie && (
          <div className="bg-[#111111] p-4 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-bold text-red-500">{editingMovieId ? t('editMovie', 'Edit Movie') : t('newMovieDetails', 'New Movie Details')}</h3>
            <input 
              type="text" placeholder={t('movieName', 'Movie Name')} value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
            />
            <textarea 
              placeholder={t('description', 'Description')} value={newMovie.description} onChange={e => setNewMovie({...newMovie, description: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm h-24"
            />
            <div className="flex gap-2">
              <input 
                type="number" placeholder={t('durationInput', 'Duration (mins)')} value={newMovie.duration || ''} onChange={e => setNewMovie({...newMovie, duration: parseInt(e.target.value) || 0})}
                className="flex-1 bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
              />
              <select
                value={newMovie.language}
                onChange={e => setNewMovie({...newMovie, language: e.target.value})}
                className="flex-1 bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm text-white"
              >
                <option value="English">{t('english', 'English')}</option>
                <option value="Dubbed">{t('dubbed', 'Dubbed')}</option>
                <option value="Arabic">{t('arabic', 'Arabic')}</option>
              </select>
            </div>
            <input 
              type="text" placeholder={t('coverImage', 'Cover Image URL')} value={newMovie.coverImage} onChange={e => setNewMovie({...newMovie, coverImage: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
            />
            <input 
              type="text" placeholder={t('categoryHint', 'Category (e.g. Action)')} value={newMovie.category} onChange={e => setNewMovie({...newMovie, category: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
            />
            <button onClick={handleAddMovie} className="w-full bg-red-600 p-3 rounded-xl font-bold uppercase tracking-widest text-xs">
              {editingMovieId ? t('saveChanges', 'Save Changes') : t('saveMovie', 'Save Movie')}
            </button>
            {editingMovieId && (
              <button onClick={() => {
                setShowAddMovie(false);
                setEditingMovieId(null);
                setNewMovie({ title: '', description: '', coverImage: '', category: 'Drama', releaseYear: 2026, rating: 5.0, duration: 0, episodesCount: 0, views: 0, country: 'USA', language: 'Dubbed' });
              }} className="w-full bg-white/10 p-3 rounded-xl font-bold uppercase tracking-widest text-xs mt-2">
                {t('cancel', 'Cancel')}
              </button>
            )}
          </div>
        )}

        {selectedMovieForEpisode && (
          <div className="bg-[#111111] p-4 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-bold text-blue-500">{editingEpisodeId ? t('editEpisode', 'Edit Episode') : t('addEpisode', 'Add Episode')}</h3>
            <div className="flex gap-2">
              <input 
                type="number" placeholder={t('episodeNumber', 'Episode Number')} value={newEpisode.episodeNumber} onChange={e => setNewEpisode({...newEpisode, episodeNumber: parseInt(e.target.value) || 0})}
                className="flex-1 bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
              />
              <input 
                type="number" placeholder={t('durationInput', 'Duration (mins)')} value={newEpisode.duration || ''} onChange={e => setNewEpisode({...newEpisode, duration: parseInt(e.target.value) || 0})}
                className="flex-1 bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
              />
            </div>
            <input 
              type="text" placeholder={t('episodeTitle', 'Episode Title')} value={newEpisode.title} onChange={e => setNewEpisode({...newEpisode, title: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
            />
            <input 
              type="text" placeholder={t('videoUrl', 'Video URL')} value={newEpisode.videoUrl} onChange={e => setNewEpisode({...newEpisode, videoUrl: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-white/10 p-3 rounded-xl text-sm"
            />
            <div className="flex gap-2">
              <button onClick={handleAddEpisode} className="flex-1 bg-blue-600 p-3 rounded-xl font-bold uppercase tracking-widest text-xs">
                {editingEpisodeId ? t('saveChanges', 'Save Changes') : t('saveEpisode', 'Save Episode')}
              </button>
              <button onClick={() => {
                setSelectedMovieForEpisode(null);
                setEditingEpisodeId(null);
                setNewEpisode({ title: '', videoUrl: '', episodeNumber: 1, duration: 0 });
              }} className="flex-1 bg-white/10 p-3 rounded-xl font-bold uppercase tracking-widest text-xs">
                {t('cancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <p className="text-white/40 text-center">Loading...</p>
          ) : (
            movies.map(movie => (
              <div key={movie.id} className="bg-[#111111] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 flex gap-4 items-center">
                  <img src={movie.coverImage} className="w-16 h-24 object-cover rounded-lg" alt="cover" />
                  <div className="flex-1">
                    <h3 className="font-bold text-sm truncate">{movie.title}</h3>
                    <p className="text-xs text-white/40 mb-2">{movie.episodes?.length || 0} {t('episodes', 'Episodes')}</p>
                    <div className="flex gap-2 mt-auto">
                      <button onClick={() => {
                        setEditingEpisodeId(null);
                        setNewEpisode({ title: '', videoUrl: '', episodeNumber: (movie.episodes?.length || 0) + 1, duration: 0 });
                        setSelectedMovieForEpisode(movie.id);
                      }} className="bg-blue-600/20 text-blue-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-blue-600/30 transition-colors">
                        <Plus size={12} /> {t('addEpisode', 'Episode')}
                      </button>
                      <button onClick={() => {
                        setNewMovie(movie);
                        setEditingMovieId(movie.id);
                        setShowAddMovie(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-white/20 transition-colors">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => setMovieToDelete(movie.id)} className="bg-red-600/20 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-red-600/30 transition-colors">
                        <Trash2 size={12} />
                      </button>
                      <button 
                        onClick={() => setExpandedMovieId(expandedMovieId === movie.id ? null : movie.id)}
                        className="ml-auto bg-white/10 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:bg-white/20 transition-colors"
                      >
                        {expandedMovieId === movie.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedMovieId === movie.id && (
                  <div className="bg-[#0a0a0a] border-t border-white/5 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-white/60 mb-2">{t('episodesList', 'Episodes List')}</h4>
                    {movie.episodes && movie.episodes.length > 0 ? (
                      movie.episodes.map(ep => (
                        <div key={ep.id} className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-xl">
                          <div>
                            <p className="text-sm font-bold">{ep.episodeNumber}. {ep.title}</p>
                            <p className="text-[10px] text-white/40 mb-1">{ep.duration ? `${ep.duration} ${t('minutes', 'm')}` : ''}</p>
                            <p className="text-[10px] text-white/40 truncate w-48" dir="ltr">{ep.videoUrl}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setNewEpisode(ep);
                                setEditingEpisodeId(ep.id);
                                setSelectedMovieForEpisode(movie.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-blue-500 hover:text-blue-400 p-2"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteEpisode(movie.id, ep)}
                              className="text-red-500 hover:text-red-400 p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-white/40">{t('noEpisodes', 'No episodes added yet.')}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {movieToDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 ">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">{t('deleteMovieTitle', 'Delete Movie?')}</h3>
              <p className="text-white/60 text-sm">{t('deleteMovieConfirm', 'This action cannot be undone. All episodes will also be removed.')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMovieToDelete(null)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors">
                {t('cancel', 'Cancel')}
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(229,9,20,0.4)]">
                {t('delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
