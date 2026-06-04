import { MemberType } from '../../enums/member.enum';
import { NotificationAudience, NotificationTargetType, NotificationType } from '../../enums/notification.enum';
import { TotalCounter } from '../kindergarten/kindergarten';

export interface Notification {
	_id: string;
	recipientId: string;
	senderId?: string;
	recipientRole?: MemberType;
	type: NotificationType;
	audience: NotificationAudience;
	title: string;
	message: string;
	targetType: NotificationTargetType;
	targetId: string;
	metadata?: string;
	isRead: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface Notifications {
	list: Notification[];
	metaCounter?: TotalCounter[];
}
