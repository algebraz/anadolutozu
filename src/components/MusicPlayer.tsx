import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { usePlayerStore } from '../store/playerStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, ChevronDown } from 'lucide-react';

export default function MusicPlayer() {
  const { 
    currentSong, 
    isPlaying, 
    volume, 
    progress, 
    duration,
    isExpanded,
    pauseSong, 
    resumeSong, 
    nextSong, 
    prevSong, 
    setVolume, 
    setProgress,
    setDuration,
    toggleExpanded
  } = usePlayerStore();

  const playerRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);
  }, [currentSong?.youtubeUrl, currentSong?.audioUrl]);

  const handleProgress = (state: any) => {
    if (!seeking) {
      setProgress(state.playedSeconds);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value));
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const coverImage = currentSong?.coverImageUrl || (currentSong?.youtubeUrl ? getYouTubeThumbnail(currentSong.youtubeUrl) : '') || 'https://picsum.photos/seed/music/400/400';

  return (
    <>
      {/* Mini Player (Bottom Bar) */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-2 sm:p-4 z-50 transition-transform duration-300 ${!currentSong ? 'translate-y-full' : isExpanded ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Track Info */}
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={toggleExpanded}
          >
            <img 
              src={coverImage} 
              alt={currentSong?.title || 'Şarkı'} 
              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 truncate">{currentSong?.title || 'Şarkı Seçilmedi'}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{currentSong?.musicStyle || 'Bilinmeyen Tür'}</p>
            </div>
          </div>

          {/* Controls (Desktop & Mobile) */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={prevSong} className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hidden sm:block">
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={isPlaying ? pauseSong : resumeSong} 
              className="w-10 h-10 flex items-center justify-center bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            <button onClick={nextSong} className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Progress & Volume (Desktop Only) */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
            <span className="text-xs text-stone-500 w-10 text-right">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="w-32 h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-xs text-stone-500 w-10">{formatTime(duration)}</span>
            
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => setIsMuted(!isMuted)} className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Player (Always Mounted) */}
      <div 
        className={`fixed inset-0 z-[100] bg-white dark:bg-stone-950 flex flex-col transition-transform duration-500 ${
          isExpanded ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-8">
          <button onClick={toggleExpanded} className="p-2 text-stone-600 dark:text-stone-300">
            <ChevronDown className="w-8 h-8" />
          </button>
          <span className="text-xs font-bold tracking-widest uppercase text-stone-500 dark:text-stone-400">Şimdi Çalıyor</span>
          <div className="w-12"></div> {/* Spacer */}
        </div>

        {/* Artwork & Player */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className={`w-full max-w-sm ${currentSong?.youtubeUrl ? 'aspect-video' : 'aspect-square'} rounded-3xl shadow-2xl overflow-hidden relative bg-black transition-all duration-300`}>
            {!currentSong?.youtubeUrl && (
              <img 
                src={coverImage} 
                alt={currentSong?.title || 'Şarkı'}
                className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
              />
            )}
            <ReactPlayer
              ref={playerRef}
              url={currentSong?.youtubeUrl || currentSong?.audioUrl || ''}
              playing={isPlaying}
              volume={isMuted ? 0 : volume}
              onProgress={handleProgress}
              onReady={() => {
                setIsReady(true);
                if (playerRef.current) {
                  setDuration(playerRef.current.getDuration());
                }
              }}
              onPlay={() => {
                if (!isPlaying) resumeSong();
              }}
              onPause={() => {
                if (isPlaying) pauseSong();
              }}
              onEnded={nextSong}
              width="100%"
              height="100%"
              controls={!!currentSong?.youtubeUrl}
              style={{ pointerEvents: currentSong?.youtubeUrl ? 'auto' : 'none' }}
              config={{
                youtube: {
                  playerVars: { 
                    origin: window.location.origin,
                    rel: 0
                  }
                }
              }}
            />
          </div>
          {currentSong?.youtubeUrl && (
            <p className="mt-6 text-xs text-stone-500 dark:text-stone-400 text-center max-w-sm px-4">
              Tarayıcı güvenliği nedeniyle şarkı otomatik başlamazsa, lütfen yukarıdaki videonun oynat tuşuna basın.
            </p>
          )}
        </div>

        {/* Info & Controls */}
        <div className="p-8 pb-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">{currentSong?.title || 'Şarkı Seçilmedi'}</h2>
            <p className="text-stone-500 dark:text-stone-400">{currentSong?.musicStyle || 'Bilinmeyen Tür'}</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-3"
            />
            <div className="flex justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-8">
            <button onClick={prevSong} className="text-stone-800 dark:text-stone-200 hover:text-amber-500 transition-colors">
              <SkipBack className="w-10 h-10" />
            </button>
            <button 
              onClick={isPlaying ? pauseSong : resumeSong} 
              className="w-20 h-20 flex items-center justify-center bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-transform active:scale-95 shadow-lg shadow-amber-500/30"
            >
              {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
            </button>
            <button onClick={nextSong} className="text-stone-800 dark:text-stone-200 hover:text-amber-500 transition-colors">
              <SkipForward className="w-10 h-10" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
