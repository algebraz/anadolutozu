import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Post, Comment } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, Send, Trash2, Eye, PlayCircle, PauseCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { usePlayerStore } from '../store/playerStore';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { playSong, currentSong, isPlaying, pauseSong, resumeSong } = usePlayerStore();

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'posts', id);
        
        // Increment view count
        await updateDoc(docRef, { viewCount: increment(1) }).catch(e => console.error("Error incrementing view count:", e));

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as Post);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    const q = query(
      collection(db, 'comments'),
      where('postId', '==', id)
    );

    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      
      // Sort comments client-side (descending by createdAt)
      commentsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setComments(commentsData);
    });

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setIsAdmin(userSnap.data().role === 'admin' || user.email === 'zaferozlu@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      unsubscribeComments();
      unsubscribeAuth();
    };
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !auth.currentUser || !id) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        postId: id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'İsimsiz Kullanıcı',
        userPhoto: auth.currentUser.photoURL || '',
        text: commentText.trim(),
        createdAt: serverTimestamp()
      });
      setCommentText('');
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Yorum eklenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Helper to extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex justify-center py-20 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center py-20 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-4">Şarkı bulunamadı</h2>
        <Link to="/" className="text-amber-500 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  const youtubeId = post.youtubeUrl ? getYouTubeId(post.youtubeUrl) : null;
  const isCurrentSong = currentSong?.id === post.id;

  const handlePlayClick = () => {
    if (isCurrentSong) {
      if (isPlaying) pauseSong();
      else resumeSong();
    } else {
      playSong(post);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-20 transition-colors duration-300">
      {/* Header Image / Video */}
      <div className="w-full bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto">
          {youtubeId ? (
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={post.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : post.coverImageUrl ? (
            <div className="aspect-video w-full relative">
              <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-50 dark:from-stone-950 to-transparent"></div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-amber-500 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Geri Dön
        </Link>

        <header className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              {post.title}
            </h1>
            <button 
              onClick={handlePlayClick}
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white dark:text-stone-950 font-bold px-6 py-3 rounded-full transition-transform active:scale-95 shrink-0 shadow-lg shadow-amber-500/20"
            >
              {isCurrentSong && isPlaying ? (
                <>
                  <PauseCircle className="w-6 h-6" />
                  Duraklat
                </>
              ) : (
                <>
                  <PlayCircle className="w-6 h-6" />
                  {isCurrentSong ? 'Devam Et' : 'Şimdi Dinle'}
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            {post.createdAt && (
              <p>
                {format(post.createdAt.toDate(), 'd MMMM yyyy', { locale: tr })}
              </p>
            )}
            <div className="flex items-center gap-1 text-sm">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount || 0} okunma</span>
            </div>
          </div>
        </header>

        {/* Long Text Sections */}
        <div className="space-y-12">
          {post.story && (
            <section>
              <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">Hikayesi</h2>
              <div className="prose prose-stone dark:prose-invert max-w-none text-stone-700 dark:text-stone-300">
                <ReactMarkdown>{post.story}</ReactMarkdown>
              </div>
            </section>
          )}

          {post.lyrics && (
            <section>
              <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">Şarkı Sözü ve Yapısı</h2>
              <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 whitespace-pre-wrap font-serif text-stone-800 dark:text-stone-300 shadow-sm">
                {post.lyrics}
              </div>
            </section>
          )}

          {post.rhythm && (
            <section>
              <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-500 mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">Matematiksel Ritim ve Düzenleme (Teorik Bilgi)</h2>
              <div className="prose prose-stone dark:prose-invert max-w-none text-stone-700 dark:text-stone-300">
                <ReactMarkdown>{post.rhythm}</ReactMarkdown>
              </div>
            </section>
          )}
        </div>

        {/* Comments Section */}
        <section className="mt-20 border-t border-stone-200 dark:border-stone-800 pt-12">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-8">Yorumlar ve Soru-Cevap</h2>
          
          {auth.currentUser ? (
            <form onSubmit={handleCommentSubmit} className="mb-10">
              <div className="flex gap-4">
                {auth.currentUser.photoURL ? (
                  <img src={auth.currentUser.photoURL} alt="Profil" className="w-10 h-10 rounded-full border border-stone-200 dark:border-stone-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500">
                    {auth.currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Şarkı hakkında ne düşünüyorsun? Sorularını veya yorumlarını paylaş..."
                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-h-[100px] resize-y"
                    required
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !commentText.trim()}
                      className="bg-amber-500 hover:bg-amber-600 text-white dark:text-stone-950 font-medium px-6 py-2 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Gönderiliyor...' : (
                        <>
                          <Send className="w-4 h-4" />
                          Gönder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 text-center mb-10 shadow-sm">
              <p className="text-stone-600 dark:text-stone-400 mb-4">Yorum yapmak veya soru sormak için giriş yapmalısınız.</p>
              <p className="text-sm text-stone-500">Sağ üst köşedeki "Giriş Yap" butonunu kullanabilirsiniz.</p>
            </div>
          )}

          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/50 rounded-xl p-5 flex gap-4 shadow-sm">
                  {comment.userPhoto ? (
                    <img src={comment.userPhoto} alt={comment.userName} className="w-10 h-10 rounded-full border border-stone-200 dark:border-stone-700 shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 shrink-0">
                      {comment.userName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-900 dark:text-stone-200">{comment.userName}</span>
                        {comment.createdAt && (
                          <span className="text-xs text-stone-500">
                            {format(comment.createdAt.toDate(), 'd MMM yyyy, HH:mm', { locale: tr })}
                          </span>
                        )}
                      </div>
                      {(isAdmin || (auth.currentUser && auth.currentUser.uid === comment.userId)) && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                          title="Yorumu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-stone-500 text-center py-8">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ title, content }: { title: string, content: string }) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-stone-200 font-medium">{content}</p>
    </div>
  );
}
