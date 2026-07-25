import { useEffect, useRef, useState } from "react";

const MUSIC_SRC = "/audio/background-music.mp3";
const LOGO_SRC = "/images/gdpt-logo.jpg";
const PAUSED_STORAGE_KEY = "province_game_music_paused";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;

    // User explicitly paused it last time (persists across full page
    // reloads, e.g. a mobile browser refresh) — respect that instead of
    // forcing autoplay again.
    if (localStorage.getItem(PAUSED_STORAGE_KEY) === "1") return;

    let cancelled = false;

    // preload="none" on the <audio> element means nothing downloads until
    // play() is called — and once called, the browser streams it
    // progressively rather than waiting for the whole file, so playback
    // starts as soon as the first chunk buffers instead of blocking on the
    // full download.
    function tryPlay() {
      audio!
        .play()
        .then(() => {
          if (!cancelled) setPlaying(true);
        })
        .catch(() => {
          // Autoplay-with-sound is blocked by the browser until the visitor
          // interacts with the page at all — resume on the first tap/click/
          // keypress anywhere.
          document.addEventListener("pointerdown", resume, { once: true });
          document.addEventListener("keydown", resume, { once: true });
        });
    }

    function resume() {
      tryPlay();
    }

    tryPlay();

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("keydown", resume);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true));
      localStorage.removeItem(PAUSED_STORAGE_KEY);
    } else {
      audio.pause();
      setPlaying(false);
      localStorage.setItem(PAUSED_STORAGE_KEY, "1");
    }
  }

  return (
    <>
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        title={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
        className={`music-disc fixed bottom-4 right-4 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg border-2 border-white overflow-hidden bg-slate-900 ${
          playing ? "is-spinning" : ""
        }`}
      >
        <img src={LOGO_SRC} alt="Nhạc nền" className="w-full h-full object-cover pointer-events-none" />
      </button>
    </>
  );
}
