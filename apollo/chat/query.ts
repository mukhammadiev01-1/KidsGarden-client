import { gql } from '@apollo/client';

export const GET_CONVERSATION = gql`
	query GetConversation($conversationId: String!) {
		getConversation(conversationId: $conversationId) {
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

export const GET_MESSAGES = gql`
	query GetMessages($input: MessagesInquiry!) {
		getMessages(input: $input) {
			list {
				_id
				conversationId
				senderId
				text
				readBy
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;
