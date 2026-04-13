import { create } from 'zustand';
import { Post } from '../types';

interface PlayerState {
  currentSong: Post | null;
  playlist: Post[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  isExpanded: boolean; // For mobile full-screen player
  
  setPlaylist: (posts: Post[]) => void;
  playSong: (post: Post) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  toggleExpanded: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  playlist: [],
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  isExpanded: false,

  setPlaylist: (posts) => {
    set((state) => {
      // If there's no current song, set the first song from the playlist
      if (!state.currentSong && posts.length > 0) {
        return { playlist: posts, currentSong: posts[0] };
      }
      return { playlist: posts };
    });
  },
  
  playSong: (post) => set({ currentSong: post, isPlaying: true }),
  
  pauseSong: () => set({ isPlaying: false }),
  
  resumeSong: () => set({ isPlaying: true }),
  
  nextSong: () => {
    const { currentSong, playlist } = get();
    if (!currentSong || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(p => p.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    set({ currentSong: playlist[nextIndex], isPlaying: true, progress: 0 });
  },
  
  prevSong: () => {
    const { currentSong, playlist } = get();
    if (!currentSong || playlist.length === 0) return;
    
    const currentIndex = playlist.findIndex(p => p.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({ currentSong: playlist[prevIndex], isPlaying: true, progress: 0 });
  },
  
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));
