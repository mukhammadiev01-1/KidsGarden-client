import { gql } from '@apollo/client';

const CONVERSATION_FIELDS = gql`
	fragment ConversationFields on Conversation {
		_id
		type
		applicationId
		kindergartenId
		parentId
		childId
		groupId
		teacherId
		participantIds
		lastMessage
		lastMessageAt
		createdAt
		updatedAt
	}
`;

const MY_CONVERSATION_SUMMARY_FIELDS = gql`
	fragment MyConversationSummaryFields on MyConversationSummary {
		conversationId
		conversationType
		title
		subtitle
		avatar
		kindergartenId
		childId
		teacherId
		parentId
		applicationId
		lastMessage
		lastMessageAt
		unreadCount
		targetRoute
		participantLabel
	}
`;

const MESSAGE_FIELDS = gql`
	fragment MessageFields on Message {
		_id
		conversationId
		senderId
		text
		attachments {
			url
			name
			mimeType
			size
		}
		readBy
		createdAt
		updatedAt
	}
`;

export const GET_CONVERSATION = gql`
	query GetConversation($conversationId: String!) {
		getConversation(conversationId: $conversationId) {
			...ConversationFields
		}
	}
	${CONVERSATION_FIELDS}
`;

export const GET_MESSAGES = gql`
	query GetMessages($input: MessagesInquiry!) {
		getMessages(input: $input) {
			list {
				...MessageFields
			}
			metaCounter {
				total
			}
		}
	}
	${MESSAGE_FIELDS}
`;

export const GET_MY_CONVERSATIONS = gql`
	query GetMyConversations($input: MyConversationsInput) {
		getMyConversations(input: $input) {
			list {
				...MyConversationSummaryFields
			}
			total
		}
	}
	${MY_CONVERSATION_SUMMARY_FIELDS}
`;

export const GET_MY_UNREAD_MESSAGE_COUNT = gql`
	query GetMyUnreadMessageCount {
		getMyUnreadMessageCount
	}
`;

export const GET_PARENT_TEACHER_CONVERSATION = gql`
	query GetParentTeacherConversation($conversationId: String!) {
		getParentTeacherConversation(conversationId: $conversationId) {
			...ConversationFields
		}
	}
	${CONVERSATION_FIELDS}
`;

export const GET_PARENT_TEACHER_MESSAGES = gql`
	query GetParentTeacherMessages($input: MessagesInquiry!) {
		getParentTeacherMessages(input: $input) {
			list {
				...MessageFields
			}
			metaCounter {
				total
			}
		}
	}
	${MESSAGE_FIELDS}
`;
