// Extrae el ID de video de distintas variantes de URL de YouTube:
// https://youtu.be/ID, https://www.youtube.com/watch?v=ID, https://www.youtube.com/embed/ID, ?si=... etc.
export function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('/')[0] || null;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1];
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function getYouTubeEmbedUrl(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
}
