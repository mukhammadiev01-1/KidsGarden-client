import imageCompression from 'browser-image-compression';
import { ChatAttachment } from '../../types/chat/message';

export const CHAT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const CHAT_IMAGE_ACCEPT = CHAT_IMAGE_MIME_TYPES.join(',');
export const MAX_CHAT_IMAGES = 3;
export const MAX_CHAT_IMAGE_SIZE_BYTES = 1024 * 1024;

export const compressChatImageFiles = async (files: File[]): Promise<File[]> => {
	if (files.length > MAX_CHAT_IMAGES) {
		throw new Error(`You can attach up to ${MAX_CHAT_IMAGES} images.`);
	}

	const compressedFiles: File[] = [];

	for (const file of files) {
		if (!CHAT_IMAGE_MIME_TYPES.includes(file.type)) {
			throw new Error('Only JPG, PNG, and WEBP images can be attached.');
		}

		const compressedFile = await imageCompression(file, {
			maxSizeMB: 1,
			maxWidthOrHeight: 1280,
			useWebWorker: true,
		});

		if (compressedFile.size > MAX_CHAT_IMAGE_SIZE_BYTES) {
			throw new Error('Each chat image must be 1MB or smaller after compression.');
		}

		compressedFiles.push(compressedFile);
	}

	return compressedFiles;
};

export const toChatAttachmentInput = (attachment: ChatAttachment): ChatAttachment => ({
	url: attachment.url,
	name: attachment.name,
	mimeType: attachment.mimeType,
	size: attachment.size,
});
