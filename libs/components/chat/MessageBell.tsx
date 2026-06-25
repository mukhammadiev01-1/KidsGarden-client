import React, { MouseEvent, useCallback, useMemo, useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import {
	Avatar,
	Badge,
	Box,
	Button,
	CircularProgress,
	IconButton,
	Popover,
	Stack,
	Typography,
} from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { useRouter } from 'next/router';
import { GET_MY_CONVERSATIONS, GET_MY_UNREAD_MESSAGE_COUNT } from '../../../apollo/chat/query';
import { userVar } from '../../../apollo/store';
import { getImageUrl } from '../../config';
import { useRealtimeEvent } from '../../hooks/useRealtimeEvent';
import { MyConversationSummary, MyConversationsInput } from '../../types/chat/conversation';

const APPLICATION_CHAT_MESSAGE_CREATED_EVENT = 'application_chat.message.created';
const PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT = 'parent_teacher_chat.message.created';

const conversationsInput: MyConversationsInput = {
	page: 1,
	limit: 8,
};

const formatConversationTime = (value?: Date | string | null): string => {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	const now = new Date();
	const sameDay = date.toDateString() === now.toDateString();
	if (sameDay) {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getInitial = (title?: string): string => {
	const value = title?.trim();
	return value ? value.charAt(0).toUpperCase() : 'C';
};

const MessageBell = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);

	const {
		data: countData,
		loading: countLoading,
		refetch: refetchUnreadCount,
	} = useQuery(GET_MY_UNREAD_MESSAGE_COUNT, {
		skip: !user?._id,
		fetchPolicy: 'network-only',
	});

	const {
		data: conversationsData,
		loading: conversationsLoading,
		error: conversationsError,
		refetch: refetchConversations,
	} = useQuery(GET_MY_CONVERSATIONS, {
		variables: { input: conversationsInput },
		skip: !user?._id || !open,
		fetchPolicy: 'network-only',
	});

	const unreadCount = countData?.getMyUnreadMessageCount ?? 0;
	const conversations: MyConversationSummary[] = conversationsData?.getMyConversations?.list ?? [];

	const refreshConversations = useCallback(() => {
		void refetchUnreadCount().catch(() => undefined);
		if (open) void refetchConversations({ input: conversationsInput }).catch(() => undefined);
	}, [open, refetchConversations, refetchUnreadCount]);

	useRealtimeEvent(APPLICATION_CHAT_MESSAGE_CREATED_EVENT, refreshConversations, Boolean(user?._id));
	useRealtimeEvent(PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT, refreshConversations, Boolean(user?._id));

	if (!user?._id) return null;

	const openHandler = async (event: MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
		await refetchUnreadCount().catch(() => undefined);
	};

	const closeHandler = () => setAnchorEl(null);

	const conversationClickHandler = async (conversation: MyConversationSummary) => {
		closeHandler();
		await router.push(`/messages?conversationId=${conversation.conversationId}`);
	};

	const viewAllHandler = async () => {
		closeHandler();
		await router.push('/messages');
	};

	const popoverTitle = useMemo(() => {
		const total = conversationsData?.getMyConversations?.total;
		return total ? `Chats (${total})` : 'Chats';
	}, [conversationsData?.getMyConversations?.total]);

	return (
		<>
			<IconButton
				aria-label="Chats"
				onClick={openHandler}
				size="small"
				className="message-icon-button"
				sx={{ color: '#24332d' }}
			>
				<Badge
					badgeContent={countLoading ? 0 : unreadCount}
					max={99}
					color="error"
					overlap="circular"
					sx={{ '& .MuiBadge-badge': { fontSize: '10px', minWidth: 16, height: 16 } }}
				>
					<ChatBubbleOutlineRoundedIcon className="message-icon" />
				</Badge>
			</IconButton>

			<Popover
				className="message-popover"
				open={open}
				anchorEl={anchorEl}
				onClose={closeHandler}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Stack
					className="message-panel"
					sx={{
						width: 390,
						maxWidth: 'calc(100vw - 24px)',
						maxHeight: '72vh',
						p: 2,
						gap: 1.5,
						overflow: 'hidden',
					}}
				>
					<Stack className="message-panel-header" direction="row" justifyContent="space-between" alignItems="center" gap={1}>
						<Typography sx={{ fontWeight: 800, color: '#24332d' }}>{popoverTitle}</Typography>
						<Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#6f8177' }}>Private</Typography>
					</Stack>

					{conversationsLoading && (
						<Stack direction="row" alignItems="center" gap={1}>
							<CircularProgress size={16} />
							<Typography sx={{ fontSize: '13px', color: '#64746b' }}>Loading chats...</Typography>
						</Stack>
					)}

					{conversationsError && (
						<Typography sx={{ fontSize: '13px', color: '#b42318' }}>Chats could not be loaded.</Typography>
					)}

					{!conversationsLoading && !conversationsError && conversations.length === 0 && (
						<Typography className="message-empty-state" sx={{ fontSize: '13px', color: '#64746b' }}>
							No chats yet.
						</Typography>
					)}

					{conversations.length > 0 && (
						<Stack className="message-list-scroll" gap={1} sx={{ maxHeight: 370, overflowY: 'auto', pr: 0.5 }}>
							{conversations.map((conversation) => (
								<Box
									className={`message-list-item ${conversation.unreadCount > 0 ? 'is-unread' : 'is-read'}`}
									component="button"
									key={conversation.conversationId}
									type="button"
									onClick={() => conversationClickHandler(conversation)}
									sx={{
										width: '100%',
										textAlign: 'left',
										border: '1px solid #e5eee8',
										borderRadius: '14px',
										p: '10px',
										background: conversation.unreadCount > 0 ? '#f0faef' : '#fff',
										cursor: 'pointer',
									}}
								>
									<Stack direction="row" gap={1.25} alignItems="flex-start">
										<Avatar
											src={conversation.avatar ? getImageUrl(conversation.avatar) : undefined}
											alt={conversation.title}
											sx={{ width: 38, height: 38, bgcolor: '#e3f2df', color: '#2f7d4a', fontWeight: 800 }}
										>
											{getInitial(conversation.title)}
										</Avatar>
										<Stack gap={0.35} sx={{ minWidth: 0, flex: 1 }}>
											<Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
												<Typography
													sx={{
														fontSize: '13px',
														fontWeight: 800,
														color: '#24332d',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
												>
													{conversation.title}
												</Typography>
												<Typography sx={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
													{formatConversationTime(conversation.lastMessageAt)}
												</Typography>
											</Stack>
											<Typography sx={{ fontSize: '12px', color: '#64746b' }}>
												{conversation.subtitle || conversation.participantLabel || 'Private chat'}
											</Typography>
											<Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
												<Typography
													sx={{
														fontSize: '12px',
														color: '#7d8d84',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
														minWidth: 0,
													}}
												>
													{conversation.lastMessage || 'No messages yet.'}
												</Typography>
												{conversation.unreadCount > 0 && (
													<Box
														component="span"
														sx={{
															minWidth: 20,
															height: 20,
															px: 0.6,
															borderRadius: '999px',
															background: '#2f7d4a',
															color: '#fff',
															fontSize: '11px',
															fontWeight: 800,
															lineHeight: '20px',
															textAlign: 'center',
															flexShrink: 0,
														}}
													>
														{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
													</Box>
												)}
											</Stack>
										</Stack>
									</Stack>
								</Box>
							))}
						</Stack>
					)}

					<Button
						size="small"
						onClick={viewAllHandler}
						sx={{ justifyContent: 'center', color: '#2f7d4a', textTransform: 'none', fontWeight: 800 }}
					>
						View all messages
					</Button>
				</Stack>
			</Popover>
		</>
	);
};

export default MessageBell;
