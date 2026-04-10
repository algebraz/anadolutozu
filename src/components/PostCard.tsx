import { Link } from 'react-router-dom';
import { Post } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PlayCircle, Image as ImageIcon } from 'lucide-react';

export default function PostCard({ post }: { post: Post }) {
  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  };

  const thumbUrl = post.coverImageUrl || (post.youtubeUrl ? getYouTubeThumbnail(post.youtubeUrl) : null);

  return (
    <Link to={`/post/${post.id}`} className="group block h-full">
      <div className="bg-stone-900 rounded-xl overflow-hidden border border-stone-800 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 h-full flex flex-col">
        <div className="aspect-video relative overflow-hidden bg-stone-800 shrink-0">
          {thumbUrl ? (
            <img 
              src={thumbUrl} 
              alt={post.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-800 group-hover:bg-stone-700 transition-colors">
              <ImageIcon className="w-12 h-12 text-stone-600 group-hover:text-amber-500 transition-colors" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-80"></div>
          
          {post.youtubeUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <PlayCircle className="w-16 h-16 text-amber-500 drop-shadow-lg" />
            </div>
          )}
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.musicStyle && (
              <span className="px-2.5 py-1 rounded-md bg-stone-950 text-amber-500 text-xs font-medium border border-stone-800">
                {post.musicStyle}
              </span>
            )}
            {post.createdAt && (
              <span className="text-stone-500 text-xs font-medium">
                {format(post.createdAt.toDate(), 'd MMM yyyy', { locale: tr })}
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-stone-100 mb-2 group-hover:text-amber-500 transition-colors line-clamp-2 font-serif">
            {post.title}
          </h3>
          
          {post.story && (
            <p className="text-stone-400 text-sm line-clamp-3 mt-auto">
              {post.story}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
