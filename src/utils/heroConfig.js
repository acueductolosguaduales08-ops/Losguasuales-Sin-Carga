const HERO_IMAGE_URL_KEY = 'acueducto_hero_image_url';

export function getStoredHeroImageUrl() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(HERO_IMAGE_URL_KEY) || '';
}

export function setStoredHeroImageUrl(url) {
  if (typeof window === 'undefined') return;
  const normalized = (url || '').trim();
  if (normalized) {
    window.localStorage.setItem(HERO_IMAGE_URL_KEY, normalized);
  } else {
    window.localStorage.removeItem(HERO_IMAGE_URL_KEY);
  }
}
