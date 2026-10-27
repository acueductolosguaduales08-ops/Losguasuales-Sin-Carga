import { useEffect, useState } from 'react';
import logo from '../../assets/logo-losguaduales.webp';

const TEXT = 'Acueducto Los Guaduales';
const TYPING_SPEED = 35;

export default function Intro({ onFinish }) {
  const [typed, setTyped] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let i = 0;
    let typingTimer;
    const startTimer = setTimeout(() => {
      typingTimer = setInterval(() => {
        i += 1;
        setTyped(TEXT.slice(0, i));
        if (i >= TEXT.length) {
          clearInterval(typingTimer);
          setTimeout(() => setShowCursor(false), 300);
          setTimeout(() => setFadeOut(true), 500);
          setTimeout(() => onFinish?.(), 800);
        }
      }, TYPING_SPEED);
    }, 400);

    return () => {
      clearTimeout(startTimer);
      clearInterval(typingTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-950 transition-colors transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-60 transition-opacity duration-1000">
        <div className="absolute top-[20%] left-[25%] w-72 h-72 rounded-full bg-brand/10 dark:bg-brand/15 blur-[100px] animate-blob1" />
        <div className="absolute bottom-[20%] right-[25%] w-80 h-80 rounded-full bg-agua/10 dark:bg-brand-light/10 blur-[100px] animate-blob2" />
      </div>

      <div className="flex items-center justify-center select-none relative z-10 scale-95 md:scale-100">
        <div className="intro-logo flex items-center justify-end">
          <img
            src={logo}
            alt="Logo Acueducto Los Guaduales"
            className="w-14 h-14 object-contain drop-shadow-[0_8px_16px_rgba(37,99,235,0.25)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] logo-glow"
          />
        </div>

        <div className="intro-divider w-[2px] bg-gradient-to-b from-transparent via-brand to-transparent dark:via-brand-light mx-6 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />

        <div className="flex items-center min-w-[200px] sm:min-w-[260px] h-10">
          <span className="text-sm sm:text-base md:text-lg font-light tracking-wider bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent font-medium whitespace-nowrap">
            {typed}
          </span>
          {showCursor && <span className="intro-cursor inline-block w-[3px] h-5 bg-brand dark:bg-brand-light ml-1.5 shadow-[0_0_8px_rgba(37,99,235,0.6)] rounded-full" />}
        </div>
      </div>
    </div>
  );
}
