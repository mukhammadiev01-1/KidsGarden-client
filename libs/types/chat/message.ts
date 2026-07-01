import { Direction } from '../../enums/common.enum';
import { ConversationType } from '../../enums/chat.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface Message {
	_id: string;
	conversationId: string;
	senderId: string;
	text?: string | null;
	attachments?: ChatAttachment[];
	readBy: string[];
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface ChatAttachment {
	url: string;
	name: string;
	mimeType: string;
	size: number;
}

export interface Messages {
	list: Message[];
	metaCounter?: TotalCounter[];
}

interface MessageSearch {
	conversationId: string;
}

export interface MessagesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: MessageSearch;
}

export interface SendMessageInput {
	conversationId: string;
	text?: string;
	attachments?: ChatAttachment[];
}

export interface TranslateChatMessageInput {
	conversationType: ConversationType;
	messageId: string;
	targetLang: 'en' | 'ko' | 'ru' | 'uz';
}

export interface TranslatedMessage {
	messageId: string;
	targetLang: string;
	translatedText: string;
}

export interface ParentTeacherConversationInput {
	childId: string;
	teacherId?: string;
}
