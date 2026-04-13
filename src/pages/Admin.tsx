import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, orderBy, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ShieldAlert, Save, Plus, List, BarChart2, Trash2, Eye, LayoutDashboard, Music, Upload, Loader2, Edit } from 'lucide-react';
import { Post } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'list' | 'stats'>('new');
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    youtubeUrl: '',
    story: '',
    lyrics: '',
    rhythm: '',
    coverImageUrl: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const response = await fetch('https://api.imgbb.com/1/upload?key=4fd59b3be8d65fb4ea9b19386dcfe820', {
        method: 'POST',
        body: uploadData,
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({ ...prev, coverImageUrl: data.data.url }));
      } else {
        alert('Görsel yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Görsel yüklenirken bir hata oluştu.');
    } finally {
      setUploadingImage(false);
    }
  };

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

  const resetForm = () => {
    setFormData({
      title: '',
      youtubeUrl: '',
      story: '',
      lyrics: '',
      rhythm: '',
      coverImageUrl: ''
    });
    setEditingPostId(null);
  };

  const handleEdit = (post: Post) => {
    setFormData({
      title: post.title || '',
      youtubeUrl: post.youtubeUrl || '',
      story: post.story || '',
      lyrics: post.lyrics || '',
      rhythm: post.rhythm || '',
      coverImageUrl: post.coverImageUrl || ''
    });
    setEditingPostId(post.id);
    setActiveTab('new');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !auth.currentUser) return;
    
    setSubmitting(true);
    try {
      if (editingPostId) {
        const docRef = doc(db, 'posts', editingPostId);
        await updateDoc(docRef, {
          title: formData.title,
          youtubeUrl: formData.youtubeUrl,
          story: formData.story,
          lyrics: formData.lyrics,
          rhythm: formData.rhythm,
          coverImageUrl: formData.coverImageUrl
        });
        alert('Şarkı başarıyla güncellendi!');
        setActiveTab('list');
        resetForm();
      } else {
        const docRef = await addDoc(collection(db, 'posts'), {
          ...formData,
          createdAt: serverTimestamp(),
          authorId: auth.currentUser.uid,
          viewCount: 0
        });
        alert('Şarkı başarıyla eklendi!');
        navigate(`/post/${docRef.id}`);
      }
    } catch (error: any) {
      console.error("Error saving document: ", error);
      alert(`Bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
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
            onClick={() => { setActiveTab('new'); resetForm(); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'new' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">{editingPostId ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}</span>
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
            <h1 className="text-3xl font-bold mb-8 font-serif">{editingPostId ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}</h1>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-stone-400 mb-2">Kapak Görseli URL</label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      name="coverImageUrl"
                      value={formData.coverImageUrl}
                      onChange={handleChange}
                      className="flex-1 bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      placeholder="https://..."
                    />
                    <label className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 rounded-lg cursor-pointer transition-colors border border-stone-700 whitespace-nowrap">
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <span className="text-sm font-medium">{uploadingImage ? 'Yükleniyor...' : 'Görsel Seç / Yükle'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
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

              <div className="pt-4 border-t border-stone-800 flex justify-end gap-4">
                {editingPostId && (
                  <button
                    type="button"
                    onClick={() => { resetForm(); setActiveTab('list'); }}
                    className="px-6 py-3 rounded-lg font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                  >
                    İptal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {submitting ? 'Kaydediliyor...' : (editingPostId ? 'Değişiklikleri Kaydet' : 'Şarkıyı Kaydet ve Yayınla')}
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
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEdit(post)}
                                className="p-2 text-stone-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
