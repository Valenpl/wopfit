/**
 * Achica una foto (lado mayor 1080 px, JPEG) antes de subirla y la devuelve como data URL.
 * Usa createImageBitmap y OffscreenCanvas: no crea elementos en la página.
 */
export async function shrink(file) {
  let img;
  try { img = await createImageBitmap(file); } catch { throw new Error('No pudimos abrir esa imagen'); }
  const k = Math.min(1, 1080 / Math.max(img.width, img.height));
  const canvas = new OffscreenCanvas(Math.round(img.width * k), Math.round(img.height * k));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // JPEG no tiene transparencia: sin esto un PNG transparente queda con fondo negro
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('No pudimos abrir esa imagen'));
    fr.readAsDataURL(blob);
  });
}
