import { gql } from '@apollo/client';

export const GET_MY_NOTIFICATIONS = gql`
	query GetMyNotifications($input: NotificationsInquiry!) {
		getMyNotifications(input: $input) {
			list {
				_id
				recipientId
				senderId
				recipientRole
				type
				audience
				title
				message
				targetType
				targetId
				metadata
				isRead
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_UNREAD_NOTIFICATION_COUNT = gql`
	query GetMyUnreadNotificationCount {
		getMyUnreadNotificationCount
	}
`;
