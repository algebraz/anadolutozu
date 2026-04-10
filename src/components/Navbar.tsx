import { Link } from 'react-router-dom';
import { Music, LogIn, LogOut, Shield } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Navbar() {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user exists in db, if not create as 'user'
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          try {
            await setDoc(userRef, {
              email: currentUser.email,
              role: 'user',
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Error creating user profile", e);
          }
        } else {
          setIsAdmin(userSnap.data().role === 'admin' || currentUser.email === 'zaferozlu@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <nav className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 hover:text-amber-500 transition-colors">
            <Music className="w-6 h-6 text-amber-500" />
            <span className="font-bold text-xl tracking-tight">Anadolu Tozu</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-stone-300 hover:text-amber-500 transition-colors">
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-stone-700" referrerPolicy="no-referrer" />
                  )}
                  <span className="text-sm hidden sm:block text-stone-300">{user.displayName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-medium text-stone-400 hover:text-stone-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 text-sm font-medium bg-stone-800 hover:bg-stone-700 text-stone-100 px-4 py-2 rounded-md transition-colors border border-stone-700"
              >
                <LogIn className="w-4 h-4" />
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
