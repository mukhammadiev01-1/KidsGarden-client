import { ConversationType } from '../../enums/chat.enum';

export interface Conversation {
	_id: string;
	type: ConversationType;
	applicationId: string;
	kindergartenId: string;
	parentId: string;
	participantIds: string[];
	lastMessage?: string;
	lastMessageAt?: Date | string;
	createdAt: Date | string;
	updatedAt: Date | string;
}
