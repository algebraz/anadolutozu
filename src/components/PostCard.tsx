import { Link } from 'react-router-dom';
import { Post } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PlayCircle, Image as ImageIcon, Eye, Play } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

export default function PostCard({ post }: { post: Post }) {
  const { playSong, currentSong, isPlaying, pauseSong, resumeSong } = usePlayerStore();
  
  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  };

  const thumbUrl = post.coverImageUrl || (post.youtubeUrl ? getYouTubeThumbnail(post.youtubeUrl) : null);
  const isCurrentSong = currentSong?.id === post.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to post detail
    if (isCurrentSong) {
      if (isPlaying) pauseSong();
      else resumeSong();
    } else {
      playSong(post);
    }
  };

  return (
    <Link to={`/post/${post.id}`} className="group block h-full">
      <div className="bg-white dark:bg-stone-900 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 h-full flex flex-col">
        <div className="aspect-video relative overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
          {thumbUrl ? (
            <img 
              src={thumbUrl} 
              alt={post.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-colors">
              <ImageIcon className="w-12 h-12 text-stone-400 dark:text-stone-600 group-hover:text-amber-500 transition-colors" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80"></div>
          
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isCurrentSong ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button 
              onClick={handlePlayClick}
              className="w-16 h-16 flex items-center justify-center bg-amber-500/90 hover:bg-amber-500 text-white rounded-full backdrop-blur-sm transition-transform hover:scale-110 shadow-xl"
            >
              {isCurrentSong && isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-6 bg-white animate-pulse"></div>
                  <div className="w-1.5 h-6 bg-white animate-pulse delay-75"></div>
                  <div className="w-1.5 h-6 bg-white animate-pulse delay-150"></div>
                </div>
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>
          </div>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.musicStyle && (
              <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-950 text-amber-600 dark:text-amber-500 text-xs font-medium border border-stone-200 dark:border-stone-800">
                {post.musicStyle}
              </span>
            )}
            {post.createdAt && (
              <span className="text-stone-500 text-xs font-medium">
                {format(post.createdAt.toDate(), 'd MMM yyyy', { locale: tr })}
              </span>
            )}
            <span className="text-stone-500 text-xs font-medium flex items-center gap-1 ml-auto">
              <Eye className="w-3 h-3" />
              {post.viewCount || 0}
            </span>
          </div>
          
          <h3 className={`text-xl font-bold mb-2 transition-colors line-clamp-2 font-serif ${isCurrentSong ? 'text-amber-500' : 'text-stone-900 dark:text-stone-100 group-hover:text-amber-500'}`}>
            {post.title}
          </h3>
          
          {post.story && (
            <p className="text-stone-600 dark:text-stone-400 text-sm line-clamp-3 mt-auto">
              {post.story}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
