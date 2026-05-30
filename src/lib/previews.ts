const HEIC_EXTENSIONS = /\.(heic|heif)$/i;
const IMAGE_MIME_PREFIX = "image/";

export function shouldGeneratePreview(mimeType: string, fileName: string): boolean {
  return mimeType.startsWith(IMAGE_MIME_PREFIX) || HEIC_EXTENSIONS.test(fileName);
}

export function isHeicLike(fileName: string, mimeType?: string): boolean {
  return HEIC_EXTENSIONS.test(fileName) || Boolean(mimeType && isHeicMimeType(mimeType));
}

function isHeicMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase();
  return (
    normalized === "image/heic" ||
    normalized === "image/heif" ||
    normalized === "image/heic-sequence" ||
    normalized === "image/heif-sequence"
  );
}
