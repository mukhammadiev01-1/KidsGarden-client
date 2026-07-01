import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Badge,
	Box,
	Button,
	CircularProgress,
	IconButton,
	Popover,
	Stack,
	Typography,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useRouter } from 'next/router';
import { MARK_ALL_NOTIFICATIONS_READ, MARK_NOTIFICATION_READ } from '../../../apollo/notification/mutation';
import { GET_MY_NOTIFICATIONS, GET_MY_UNREAD_NOTIFICATION_COUNT } from '../../../apollo/notification/query';
import { userVar } from '../../../apollo/store';
import { Direction } from '../../enums/common.enum';
import { MemberType } from '../../enums/member.enum';
import { NotificationTargetType } from '../../enums/notification.enum';
import { useRealtimeEvent } from '../../hooks/useRealtimeEvent';
import { Notification } from '../../types/notification/notification';
import { useTranslation } from 'next-i18next';
import { NotificationsInquiry } from '../../types/notification/notification.input';

const NOTIFICATION_CREATED_EVENT = 'notification.created';

const NotificationBell = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const locale = router.locale === 'kr' ? 'ko' : router.locale || 'en';
	const user = useReactiveVar(userVar);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);

	const notificationsInput: NotificationsInquiry = useMemo(
		() => ({
			page: 1,
			limit: 10,
			sort: 'createdAt',
			direction: Direction.DESC,
			search: {},
		}),
		[],
	);

	const {
		data: countData,
		loading: countLoading,
		refetch: refetchUnreadCount,
	} = useQuery(GET_MY_UNREAD_NOTIFICATION_COUNT, {
		skip: !user?._id,
		fetchPolicy: 'network-only',
	});

	const {
		data: notificationsData,
		loading: notificationsLoading,
		error: notificationsError,
		refetch: refetchNotifications,
	} = useQuery(GET_MY_NOTIFICATIONS, {
		variables: { input: notificationsInput },
		skip: !user?._id || !open,
		fetchPolicy: 'network-only',
	});

	const [markNotificationRead] = useMutation(MARK_NOTIFICATION_READ);
	const [markAllNotificationsRead, { loading: markingAllRead }] = useMutation(MARK_ALL_NOTIFICATIONS_READ);

	const unreadCount = countData?.getMyUnreadNotificationCount ?? 0;
	const notifications: Notification[] = notificationsData?.getMyNotifications?.list ?? [];

	const notificationCreatedHandler = useCallback(() => {
		void refetchUnreadCount().catch(() => undefined);
		if (open) void refetchNotifications({ input: notificationsInput }).catch(() => undefined);
	}, [notificationsInput, open, refetchNotifications, refetchUnreadCount]);

	useRealtimeEvent<Notification>(NOTIFICATION_CREATED_EVENT, notificationCreatedHandler, Boolean(user?._id));

	if (!user?._id) return null;

	const openHandler = async (event: MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
		await refetchUnreadCount().catch(() => undefined);
	};

	const closeHandler = () => setAnchorEl(null);

	const getNotificationMetadata = (notification: Notification): Record<string, string> => {
		if (!notification.metadata) return {};

		try {
			const metadata = JSON.parse(notification.metadata);
			return metadata && typeof metadata === 'object' ? metadata : {};
		} catch {
			return {};
		}
	};

	const getArticleHref = (notification: Notification): string | null => {
		const metadata = getNotificationMetadata(notification);
		const articleId =
			metadata.articleId ||
			(notification.targetType === NotificationTargetType.BOARD_ARTICLE ? notification.targetId : '');
		const articleCategory = metadata.articleCategory || 'FREE';

		if (!articleId) return '/community';
		return `/community/detail?articleCategory=${articleCategory}&id=${articleId}`;
	};

	const getTargetHref = (notification: Notification): string | null => {
		switch (notification.targetType) {
			case NotificationTargetType.APPLICATION:
			case NotificationTargetType.APPLICATION_CHAT:
				return '/mypage?category=applications';
			case NotificationTargetType.PARENT_TEACHER_CHAT:
				if (user.memberType === MemberType.PARENT) return '/mypage?category=parentChildren';
				if (user.memberType === MemberType.TEACHER) return '/mypage?category=teacherAttendance';
				return null;
			case NotificationTargetType.STAFF_APPLICATION:
				return user.memberType === MemberType.SUPER_ADMIN
					? '/_admin/users/staff-applications'
					: '/mypage?category=staffApplications';
			case NotificationTargetType.KINDERGARTEN_ADMIN_APPLICATION:
				return user.memberType === MemberType.SUPER_ADMIN
					? '/_admin/users/kindergarten-admin-applications'
					: '/mypage?category=kindergartenAdminApplications';
			case NotificationTargetType.KINDERGARTEN:
				return notification.targetId ? `/kindergartens/detail?id=${notification.targetId}` : '/kindergartens';
			case NotificationTargetType.BOARD_ARTICLE:
				return getArticleHref(notification);
			case NotificationTargetType.COMMENT:
				return getArticleHref(notification);
			default:
				return null;
		}
	};

	const markReadHandler = async (notification: Notification) => {
		if (!notification.isRead) {
			await markNotificationRead({ variables: { notificationId: notification._id } });
			await Promise.all([
				refetchNotifications({ input: notificationsInput }).catch(() => undefined),
				refetchUnreadCount().catch(() => undefined),
			]);
		}

		const href = getTargetHref(notification);
		if (href) {
			closeHandler();
			await router.push(href);
		}
	};

	const getNotificationTitle = (notification: Notification): string =>
		notification.title || t(`notificationTypes.${notification.type}`, '');

	const markAllReadHandler = async () => {
		await markAllNotificationsRead();
		await Promise.all([
			refetchNotifications({ input: notificationsInput }).catch(() => undefined),
			refetchUnreadCount().catch(() => undefined),
		]);
	};

	return (
		<>
			<IconButton
				aria-label={t('notifications.ariaLabel')}
				onClick={openHandler}
				size="small"
				className="notification-icon-button"
				sx={{ color: '#24332d' }}
			>
				<Badge
					badgeContent={countLoading ? 0 : unreadCount}
					max={99}
					color="error"
					overlap="circular"
					sx={{ '& .MuiBadge-badge': { fontSize: '10px', minWidth: 16, height: 16 } }}
				>
					<NotificationsOutlinedIcon className="notification-icon" />
				</Badge>
			</IconButton>

			<Popover
				className="notification-popover"
				open={open}
				anchorEl={anchorEl}
				onClose={closeHandler}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Stack
					className="notification-panel"
					sx={{
						width: 430,
						maxWidth: 'calc(100vw - 24px)',
						maxHeight: '70vh',
						p: 2,
						gap: 1.5,
						overflow: 'hidden',
					}}
				>
					<Stack className="notification-panel-header" direction="row" justifyContent="space-between" alignItems="center" gap={1}>
						<Typography sx={{ fontWeight: 700, color: '#24332d' }}>{t('notifications.title')}</Typography>
						<Button
							size="small"
							disabled={markingAllRead || unreadCount === 0}
							onClick={markAllReadHandler}
							sx={{ color: '#2f7d4a', textTransform: 'none' }}
						>
							{t('notifications.markAllRead')}
						</Button>
					</Stack>

					{notificationsLoading && (
						<Stack direction="row" alignItems="center" gap={1}>
							<CircularProgress size={16} />
							<Typography sx={{ fontSize: '13px', color: '#64746b' }}>{t('notifications.loading')}</Typography>
						</Stack>
					)}

					{notificationsError && (
						<Typography sx={{ fontSize: '13px', color: '#b42318' }}>{t('notifications.loadError')}</Typography>
					)}

					{!notificationsLoading && !notificationsError && notifications.length === 0 && (
						<Typography className="notification-empty-state" sx={{ fontSize: '13px', color: '#64746b' }}>
							{t('notifications.empty')}
						</Typography>
					)}

					{notifications.length > 0 && (
						<Stack className="notification-list-scroll" gap={1} sx={{ maxHeight: 390, overflowY: 'auto', pr: 0.5 }}>
							{notifications.map((notification) => (
								<Box
									className={`notification-list-item ${notification.isRead ? 'is-read' : 'is-unread'}`}
									component="button"
									key={notification._id}
									type="button"
									onClick={() => markReadHandler(notification)}
									sx={{
										width: '100%',
										textAlign: 'left',
										border: '1px solid #e5eee8',
										borderRadius: '10px',
										p: '10px',
										background: notification.isRead ? '#fff' : '#f0faef',
										cursor: 'pointer',
									}}
								>
									<Stack gap={0.5}>
										<Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
											<Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#24332d' }}>
												{getNotificationTitle(notification)}
											</Typography>
											{!notification.isRead && (
												<span
													style={{
														width: 8,
														height: 8,
														borderRadius: '50%',
														background: '#2f7d4a',
														flexShrink: 0,
													}}
												/>
											)}
										</Stack>
										<Typography sx={{ fontSize: '12px', color: '#64746b' }}>{notification.message}</Typography>
										<Typography sx={{ fontSize: '11px', color: '#9ca3af' }}>
											{new Date(notification.createdAt).toLocaleString(locale)}
										</Typography>
									</Stack>
								</Box>
							))}
						</Stack>
					)}
				</Stack>
			</Popover>
		</>
	);
};

export default NotificationBell;
