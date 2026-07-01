import { gql } from '@apollo/client';

const CONVERSATION_FIELDS = gql`
	fragment ChatConversationFields on Conversation {
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

const MESSAGE_FIELDS = gql`
	fragment ChatMessageFields on Message {
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

export const CHAT_IMAGES_UPLOADER = gql`
	mutation ChatImagesUploader($files: [Upload!]!) {
		chatImagesUploader(files: $files) {
			url
			name
			mimeType
			size
		}
	}
`;

export const GET_OR_CREATE_APPLICATION_CONVERSATION = gql`
	mutation GetOrCreateApplicationConversation($applicationId: String!) {
		getOrCreateApplicationConversation(applicationId: $applicationId) {
			...ChatConversationFields
		}
	}
	${CONVERSATION_FIELDS}
`;

export const GET_OR_CREATE_PARENT_TEACHER_CONVERSATION = gql`
	mutation GetOrCreateParentTeacherConversation($input: ParentTeacherConversationInput!) {
		getOrCreateParentTeacherConversation(input: $input) {
			...ChatConversationFields
		}
	}
	${CONVERSATION_FIELDS}
`;

export const SEND_MESSAGE = gql`
	mutation SendMessage($input: SendMessageInput!) {
		sendMessage(input: $input) {
			...ChatMessageFields
		}
	}
	${MESSAGE_FIELDS}
`;

export const SEND_PARENT_TEACHER_MESSAGE = gql`
	mutation SendParentTeacherMessage($input: SendMessageInput!) {
		sendParentTeacherMessage(input: $input) {
			...ChatMessageFields
		}
	}
	${MESSAGE_FIELDS}
`;

export const MARK_CONVERSATION_READ = gql`
	mutation MarkConversationRead($conversationId: String!) {
		markConversationRead(conversationId: $conversationId)
	}
`;

export const MARK_PARENT_TEACHER_CONVERSATION_READ = gql`
	mutation MarkParentTeacherConversationRead($conversationId: String!) {
		markParentTeacherConversationRead(conversationId: $conversationId)
	}
`;

export const TRANSLATE_CHAT_MESSAGE = gql`
	mutation TranslateChatMessage($input: TranslateChatMessageInput!) {
		translateChatMessage(input: $input) {
			messageId
			targetLang
			translatedText
		}
	}
`;
