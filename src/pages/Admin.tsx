import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ShieldAlert, Save, Plus, List, BarChart2, Trash2, Eye, LayoutDashboard, Music } from 'lucide-react';
import { Post } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'list' | 'stats'>('new');
  const [posts, setPosts] = useState<Post[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
    musicStyle: '',
    musicalCharacter: '',
    lyricStyle: '',
    visualStyle: '',
    story: '',
    lyrics: '',
    rhythm: '',
    imagePrompt: '',
    coverImageUrl: ''
  });

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser) {
        setIsAdmin(false);
        return;
      }
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists() && (userSnap.data().role === 'admin' || auth.currentUser.email === 'zaferozlu@gmail.com')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAdmin();
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !auth.currentUser) return;
    
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...formData,
        createdAt: serverTimestamp(),
        authorId: auth.currentUser.uid,
        viewCount: 0
      });
      alert('Şarkı başarıyla eklendi!');
      navigate(`/post/${docRef.id}`);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Bu şarkıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      try {
        await deleteDoc(doc(db, 'posts', id));
      } catch (error) {
        console.error("Error deleting post:", error);
        alert('Şarkı silinirken bir hata oluştu.');
      }
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-stone-950 flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center py-20">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h2>
        <p className="text-stone-400 mb-6">Bu sayfayı görüntülemek için admin yetkisine sahip olmalısınız.</p>
        <button onClick={() => navigate('/')} className="text-amber-500 hover:underline">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const totalViews = posts.reduce((sum, post) => sum + (post.viewCount || 0), 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-stone-900 border-r border-stone-800 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <LayoutDashboard className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-bold font-serif">Admin Paneli</h2>
        </div>
        
        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'new' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Yeni Şarkı Ekle</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'list' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
          >
            <List className="w-5 h-5" />
            <span className="font-medium">Tüm Şarkılar</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'stats' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="font-medium">İstatistikler</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'new' && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 font-serif">Yeni Şarkı Ekle</h1>
            <form onSubmit={handleSubmit} className="space-y-8 bg-stone-900 p-8 rounded-2xl border border-stone-800 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-400 mb-2">Şarkı Başlığı *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">YouTube URL</label>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Kapak Görseli URL</label>
                  <input
                    type="url"
                    name="coverImageUrl"
                    value={formData.coverImageUrl}
                    onChange={handleChange}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Müzik Tarzı</label>
                  <input
                    type="text"
                    name="musicStyle"
                    value={formData.musicStyle}
                    onChange={handleChange}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Müzikal Karakter</label>
                  <input
                    type="text"
                    name="musicalCharacter"
                    value={formData.musicalCharacter}
                    onChange={handleChange}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Söz Tarzı</label>
                  <input
                    type="text"
                    name="lyricStyle"
                    value={formData.lyricStyle}
                    onChange={handleChange}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-2">Görsel Tarz</label>
                  <input
                    type="text"
                    name="visualStyle"
                    value={formData.visualStyle}
                    onChange={handleChange}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2">Hikayesi (Markdown destekler)</label>
                <textarea
                  name="story"
                  value={formData.story}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2">Şarkı Sözü ve Yapısı</label>
                <textarea
                  name="lyrics"
                  value={formData.lyrics}
                  onChange={handleChange}
                  rows={8}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2">Matematiksel Ritim ve Düzenleme (Markdown destekler)</label>
                <textarea
                  name="rhythm"
                  value={formData.rhythm}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2">Albüm Kapağı İçin Görsel Komutu (Image Prompt)</label>
                <textarea
                  name="imagePrompt"
                  value={formData.imagePrompt}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {submitting ? 'Kaydediliyor...' : 'Şarkıyı Kaydet ve Yayınla'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 font-serif">Tüm Şarkılar</h1>
            <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-950 border-b border-stone-800 text-stone-400 text-sm uppercase tracking-wider">
                      <th className="p-4 font-medium">Şarkı Başlığı</th>
                      <th className="p-4 font-medium">Tarih</th>
                      <th className="p-4 font-medium">Okunma</th>
                      <th className="p-4 font-medium text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {posts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-stone-500">Henüz şarkı eklenmemiş.</td>
                      </tr>
                    ) : (
                      posts.map(post => (
                        <tr key={post.id} className="hover:bg-stone-800/50 transition-colors">
                          <td className="p-4 font-medium text-stone-200">
                            <div className="flex items-center gap-3">
                              <Music className="w-4 h-4 text-amber-500" />
                              {post.title}
                            </div>
                          </td>
                          <td className="p-4 text-stone-400 text-sm">
                            {post.createdAt ? format(post.createdAt.toDate(), 'd MMM yyyy', { locale: tr }) : '-'}
                          </td>
                          <td className="p-4 text-stone-400 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {post.viewCount || 0}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 font-serif">İstatistikler</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Eye className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-stone-400 text-sm font-medium mb-1">Toplam Okunma</p>
                  <p className="text-3xl font-bold text-stone-100">{totalViews}</p>
                </div>
              </div>
              
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-stone-400 text-sm font-medium mb-1">Toplam Şarkı</p>
                  <p className="text-3xl font-bold text-stone-100">{posts.length}</p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-6 font-serif">En Çok Okunanlar</h2>
            <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
              <div className="divide-y divide-stone-800">
                {[...posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).map((post, index) => (
                  <div key={post.id} className="p-4 flex items-center gap-4 hover:bg-stone-800/50 transition-colors">
                    <div className="w-8 text-center text-stone-500 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-stone-200">{post.title}</h3>
                      <p className="text-xs text-stone-500">
                        {post.createdAt ? format(post.createdAt.toDate(), 'd MMM yyyy', { locale: tr }) : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-amber-500 font-medium bg-amber-500/10 px-3 py-1 rounded-full text-sm">
                      <Eye className="w-4 h-4" />
                      {post.viewCount || 0}
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="p-8 text-center text-stone-500">Veri bulunamadı.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
