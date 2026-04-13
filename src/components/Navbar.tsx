import { Link } from 'react-router-dom';
import { Music, LogIn, LogOut, Shield, Moon, Sun } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from './ThemeProvider';

export default function Navbar() {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, setTheme } = useTheme();

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
    <nav className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 hover:text-amber-500 transition-colors">
            <Music className="w-6 h-6 text-amber-500" />
            <span className="font-bold text-xl tracking-tight">Anadolu Tozu</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-stone-500 dark:text-stone-400 hover:text-amber-500 dark:hover:text-amber-500 transition-colors rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-amber-500 transition-colors">
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700" referrerPolicy="no-referrer" />
                  )}
                  <span className="text-sm hidden sm:block text-stone-600 dark:text-stone-300">{user.displayName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 text-sm font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 px-4 py-2 rounded-md transition-colors border border-stone-200 dark:border-stone-700"
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
