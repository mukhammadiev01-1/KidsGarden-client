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

export interface MyConversationSummary {
	conversationId: string;
	conversationType: ConversationType;
	title: string;
	subtitle?: string | null;
	avatar?: string | null;
	kindergartenId?: string | null;
	childId?: string | null;
	teacherId?: string | null;
	parentId?: string | null;
	applicationId?: string | null;
	lastMessage?: string | null;
	lastMessageAt?: Date | string | null;
	unreadCount: number;
	targetRoute?: string | null;
	participantLabel?: string | null;
}

export interface MyConversations {
	list: MyConversationSummary[];
	total: number;
}

export interface MyConversationsInput {
	page?: number;
	limit?: number;
	conversationType?: ConversationType;
	search?: string;
}
