import { ConversationType } from '../../enums/chat.enum';

export interface Conversation {
	_id: string;
	type: ConversationType;
	applicationId?: string | null;
	kindergartenId: string;
	parentId: string;
	childId?: string | null;
	groupId?: string | null;
	teacherId?: string | null;
	participantIds: string[];
	lastMessage?: string;
	lastMessageAt?: Date | string;
	createdAt: Date | string;
	updatedAt: Date | string;
}
