import { Direction } from '../../enums/common.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface Message {
	_id: string;
	conversationId: string;
	senderId: string;
	text: string;
	readBy: string[];
	createdAt: Date | string;
	updatedAt: Date | string;
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
	text: string;
}
