import { Direction } from '../../enums/common.enum';
import { NotificationTargetType, NotificationType } from '../../enums/notification.enum';

export interface NotificationSearch {
	isRead?: boolean;
	type?: NotificationType;
	targetType?: NotificationTargetType;
	targetId?: string;
}

export interface NotificationsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search?: NotificationSearch;
}
