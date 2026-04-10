import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { Music, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
  };

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts = posts.length > 1 ? posts.slice(1) : [];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Hero / Banner Section */}
      {loading ? (
        <div className="h-[60vh] flex justify-center items-center border-b border-stone-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : featuredPost ? (
        <div className="relative w-full h-[70vh] min-h-[500px] bg-stone-900 border-b border-stone-800 overflow-hidden group">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={featuredPost.coverImageUrl || (featuredPost.youtubeUrl ? getYouTubeThumbnail(featuredPost.youtubeUrl) : '') || 'https://picsum.photos/seed/anadolu/1920/1080'} 
              alt={featuredPost.title}
              className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/40 to-transparent"></div>
          </div>
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="max-w-3xl relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-widest rounded-sm">
                  En Yeni Kayıt
                </span>
                {featuredPost.musicStyle && (
                  <span className="text-amber-400 text-sm font-medium border border-amber-500/30 px-3 py-1 rounded-sm bg-stone-950/50 backdrop-blur-sm">
                    {featuredPost.musicStyle}
                  </span>
                )}
              </div>
              <h1 className="text-5xl sm:text-7xl font-extrabold text-stone-100 mb-6 tracking-tight drop-shadow-lg font-serif">
                {featuredPost.title}
              </h1>
              {featuredPost.story && (
                <p className="text-lg sm:text-xl text-stone-300 mb-10 line-clamp-3 max-w-2xl drop-shadow-md leading-relaxed">
                  {featuredPost.story}
                </p>
              )}
              <Link 
                to={`/post/${featuredPost.id}`}
                className="inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-4 rounded-full transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-1"
              >
                <PlayCircle className="w-6 h-6" />
                Şarkıyı Dinle & İncele
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative py-32 px-4 sm:px-6 lg:px-8 bg-stone-900 border-b border-stone-800 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-stone-900 to-stone-950"></div>
          <div className="relative max-w-3xl mx-auto text-center">
            <Music className="w-20 h-20 text-amber-500 mx-auto mb-8 opacity-80" />
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 font-serif">
              Anadolu Tozu
            </h1>
            <p className="text-xl text-stone-400 leading-relaxed">
              Yapay zeka ile üretilen, geleneksel motiflerle modern tınıların harmanlandığı müzik projesi.
            </p>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-stone-100 font-serif">Tüm Şarkılar</h2>
          <div className="h-px bg-stone-800 flex-1 ml-8"></div>
        </div>

        {!loading && gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : !loading && posts.length > 0 ? (
          <div className="text-center py-20 text-stone-500">
            <p>Başka şarkı bulunmuyor.</p>
          </div>
        ) : !loading ? (
          <div className="text-center py-20 text-stone-500">
            <p>Henüz hiç şarkı eklenmemiş.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
