import { gql } from '@apollo/client';

export const MARK_NOTIFICATION_READ = gql`
	mutation MarkNotificationRead($notificationId: String!) {
		markNotificationRead(notificationId: $notificationId)
	}
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
	mutation MarkAllNotificationsRead {
		markAllNotificationsRead
	}
`;
