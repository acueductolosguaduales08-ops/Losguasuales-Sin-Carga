import { useEffect, useState, useCallback } from 'react';
import { ConfiguracionAPI } from '../../api/configuracion';
import logo from '../../assets/logo-losguaduales.webp';
import { getStoredHeroImageUrl, setStoredHeroImageUrl } from '../../utils/heroConfig';

const REFRESH_INTERVAL = 60_000; // 1 min — recalcula hero vigente (cubre modo ALEATORIO_15MIN)

export default function Hero() {
  const [heroUrl, setHeroUrl] = useState(getStoredHeroImageUrl());

  const fetchHero = useCallback(() => {
    ConfiguracionAPI.heroActual()
      .then((data) => {
        const nextUrl = data?.link?.trim() || '';
        setHeroUrl(nextUrl);
        setStoredHeroImageUrl(nextUrl);
      })
      .catch(() => {
        setHeroUrl(getStoredHeroImageUrl());
      });
  }, []);

  useEffect(() => {
    fetchHero();
    const interval = setInterval(fetchHero, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchHero]);

  const handleImageError = () => {
    setHeroUrl('');
  };

  return (
    <section
      id="inicio"
      className="relative w-full h-56 md:h-72 bg-gray-300 dark:bg-dark-muted md:rounded-3xl overflow-hidden shadow-sm group"
    >
      <img
        src={logo}
        alt="Acueducto Los Guaduales"
        className="absolute inset-0 z-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {heroUrl ? (
        <img
          src={heroUrl}
          alt="Acueducto Los Guaduales"
          onError={handleImageError}
          className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <svg
        className="absolute bottom-0 z-30 w-full h-12 text-gray-50 dark:text-dark-bg pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1440 320"
        fill="currentColor"
      >
        <path d="M0,224L120,213.3C240,203,480,181,720,186.7C960,192,1200,224,1320,240L1440,256L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
      </svg>
    </section>
  );
}
