import { gql } from '@apollo/client';

export const GET_OR_CREATE_APPLICATION_CONVERSATION = gql`
	mutation GetOrCreateApplicationConversation($applicationId: String!) {
		getOrCreateApplicationConversation(applicationId: $applicationId) {
			_id
			type
			applicationId
			kindergartenId
			parentId
			participantIds
			lastMessage
			lastMessageAt
			createdAt
			updatedAt
		}
	}
`;

export const SEND_MESSAGE = gql`
	mutation SendMessage($input: SendMessageInput!) {
		sendMessage(input: $input) {
			_id
			conversationId
			senderId
			text
			readBy
			createdAt
			updatedAt
		}
	}
`;

export const MARK_CONVERSATION_READ = gql`
	mutation MarkConversationRead($conversationId: String!) {
		markConversationRead(conversationId: $conversationId)
	}
`;
