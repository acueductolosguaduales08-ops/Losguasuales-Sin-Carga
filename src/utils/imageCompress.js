import imageCompression from 'browser-image-compression';

/**
 * Comprime y redimensiona una imagen antes de subirla.
 * Retorna un File listo para enviar a Supabase Storage.
 */
export async function compressImage(file, {
  maxWidthOrHeight = 1200,
  maxSizeMB = 0.5,
  initialQuality = 0.8,
} = {}) {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    initialQuality,
    useWebWorker: true,
    fileType: 'image/jpeg',
    alwaysKeepResolution: false,
  };

  const compressed = await imageCompression(file, options);
  return new File([compressed], stripExtension(file.name) + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

/**
 * Genera un preview temporal (object URL) de un archivo.
 * El caller debe llamar URL.revokeObjectURL() cuando ya no lo necesite.
 */
export function createPreview(file) {
  return URL.createObjectURL(file);
}

/**
 * Extrae dimensiones de una imagen desde un File o Blob.
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Formatea bytes a KB/MB legible.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function stripExtension(name) {
  return name.replace(/\.[^.]+$/, '');
}
