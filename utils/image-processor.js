/**
 * Utilidades para procesamiento de imágenes
 * - Agregar marco negro
 * - Redimensionar
 * - Optimizar calidad
 */

/**
 * Agrega un marco negro de 2px a una imagen en base64
 * @param {string} base64Image - Imagen en base64 (con o sin prefijo data:)
 * @returns {string} - Imagen procesada en base64
 */
export function addBlackBorder(base64Image) {
  return new Promise((resolve, reject) => {
    try {
      // Crear imagen temporal
      const img = new Image();
      
      // Asegurar que tiene el prefijo correcto
      const imageData = base64Image.startsWith('data:') 
        ? base64Image 
        : `data:image/jpeg;base64,${base64Image}`;
      
      img.onload = () => {
        // Crear canvas con dimensiones + marco
        const borderWidth = 2;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width + (borderWidth * 2);
        canvas.height = img.height + (borderWidth * 2);
        
        // Dibujar fondo negro (el marco)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar la imagen encima
        ctx.drawImage(img, borderWidth, borderWidth);
        
        // Convertir a base64
        const result = canvas.toDataURL('image/jpeg', 0.95);
        resolve(result);
      };
      
      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = imageData;
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Redimensiona una imagen si es muy grande
 * @param {string} base64Image - Imagen en base64
 * @param {number} maxWidth - Ancho máximo (default: 1200px)
 * @param {number} maxHeight - Alto máximo (default: 1200px)
 * @returns {string} - Imagen redimensionada en base64
 */
export function resizeImage(base64Image, maxWidth = 1200, maxHeight = 1200) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      const imageData = base64Image.startsWith('data:') 
        ? base64Image 
        : `data:image/jpeg;base64,${base64Image}`;
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Crear canvas con nuevas dimensiones
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64
        const result = canvas.toDataURL('image/jpeg', 0.90);
        resolve(result);
      };
      
      img.onerror = () => reject(new Error('Error al redimensionar imagen'));
      img.src = imageData;
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Procesa una imagen completa: redimensionar + marco negro
 * @param {string} base64Image - Imagen en base64
 * @returns {string} - Imagen procesada
 */
export async function processImage(base64Image) {
  try {
    // 1. Redimensionar si es muy grande
    const resized = await resizeImage(base64Image);
    
    // 2. Agregar marco negro
    const withBorder = await addBlackBorder(resized);
    
    return withBorder;
  } catch (error) {
    console.error('Error procesando imagen:', error);
    // Si falla, devolver original
    return base64Image;
  }
}

/**
 * Procesa un array de imágenes
 * @param {Array} images - Array de objetos {data: base64, type: mime}
 * @returns {Array} - Array de imágenes procesadas
 */
export async function processImages(images) {
  const processed = [];
  
  for (const img of images) {
    try {
      const processedData = await processImage(img.data);
      processed.push({
        ...img,
        data: processedData
      });
    } catch (error) {
      console.error('Error procesando imagen:', error);
      // Si falla, agregar original
      processed.push(img);
    }
  }
  
  return processed;
}
