import imageCompression from 'browser-image-compression';

export const UPLOAD_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const TARGET_MAX_MB = 2;
const MAX_DIMENSION = 1600;

/**
 * Downscale and re-encode a photo so it uploads quickly, instead of refusing
 * it. Phone cameras produce 3-8 MB files; a flat "must be 2 MB or smaller"
 * rule rejected most real photos while the API itself accepts far larger
 * files. Files already under the target are returned as-is; if compression
 * fails the original is uploaded.
 */
export const prepareImageForUpload = async (file: File): Promise<File> => {
	if (file.size <= TARGET_MAX_MB * 1024 * 1024) return file;
	try {
		const compressed = await imageCompression(file, {
			maxSizeMB: TARGET_MAX_MB,
			maxWidthOrHeight: MAX_DIMENSION,
			useWebWorker: true,
			initialQuality: 0.85,
		});
		return new File([compressed], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: compressed.type || 'image/jpeg' });
	} catch (err) {
		console.warn('Image compression failed; uploading the original:', err);
		return file;
	}
};
