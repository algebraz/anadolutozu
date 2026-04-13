/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Admin from './pages/Admin';
import MusicPlayer from './components/MusicPlayer';
import { usePlayerStore } from './store/playerStore';

export default function App() {
  const { currentSong } = usePlayerStore();

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-300">
        <Navbar />
        <main className={`flex-grow ${currentSong ? 'pb-24' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <MusicPlayer />
      </div>
    </Router>
  );
}
