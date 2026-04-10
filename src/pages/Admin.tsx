import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ShieldAlert, Save, Plus } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
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
        authorId: auth.currentUser.uid
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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8 border-b border-stone-800 pb-4">
          <Plus className="w-8 h-8 text-amber-500" />
          <h1 className="text-3xl font-bold">Yeni Şarkı Ekle</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-stone-900 p-8 rounded-2xl border border-stone-800">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-stone-400 mb-1">Şarkı Başlığı *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Örn: Bozkırın Sesi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">YouTube URL</label>
              <input
                type="url"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Kapak Görseli URL</label>
              <input
                type="url"
                name="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Müzik Tarzı</label>
              <input
                type="text"
                name="musicStyle"
                value={formData.musicStyle}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Örn: Anadolu Rock, Synthwave"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Müzikal Karakter</label>
              <input
                type="text"
                name="musicalCharacter"
                value={formData.musicalCharacter}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Örn: Melankolik, Enerjik"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Söz Tarzı</label>
              <input
                type="text"
                name="lyricStyle"
                value={formData.lyricStyle}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Örn: Tasavvufi, Modern Şiir"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Görsel Tarz</label>
              <input
                type="text"
                name="visualStyle"
                value={formData.visualStyle}
                onChange={handleChange}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Örn: Cyberpunk, Minyatür Sanatı"
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-stone-800">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Hikayesi (Markdown destekler)</label>
              <textarea
                name="story"
                value={formData.story}
                onChange={handleChange}
                rows={5}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Şarkının arkasındaki hikaye..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Şarkı Sözü ve Yapısı</label>
              <textarea
                name="lyrics"
                value={formData.lyrics}
                onChange={handleChange}
                rows={8}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500 font-mono text-sm"
                placeholder="[Verse 1]&#10;Sözler..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Matematiksel Ritim ve Düzenleme (Teorik Bilgi)</label>
              <textarea
                name="rhythm"
                value={formData.rhythm}
                onChange={handleChange}
                rows={4}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Örn: 9/8'lik aksak ritim, BPM: 120..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Albüm Kapağı İçin Görsel Komutu (Image Prompt)</label>
              <textarea
                name="imagePrompt"
                value={formData.imagePrompt}
                onChange={handleChange}
                rows={3}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 text-stone-100 focus:outline-none focus:border-amber-500 font-mono text-sm"
                placeholder="A cinematic shot of..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-8 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : (
                <>
                  <Save className="w-5 h-5" />
                  Şarkıyı Yayınla
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
