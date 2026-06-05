import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { GET_MESSAGES } from '../../../apollo/chat/query';
import {
	GET_OR_CREATE_APPLICATION_CONVERSATION,
	MARK_CONVERSATION_READ,
	SEND_MESSAGE,
} from '../../../apollo/chat/mutation';
import { userVar } from '../../../apollo/store';
import { Direction } from '../../enums/common.enum';
import { useRealtimeEvent } from '../../hooks/useRealtimeEvent';
import { Conversation } from '../../types/chat/conversation';
import { Message } from '../../types/chat/message';
import { formatDate } from '../mypage/dashboardUtils';

interface Props {
	applicationId: string;
	title?: string;
	onClose?: () => void;
}

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const APPLICATION_CHAT_MESSAGE_CREATED_EVENT = 'application_chat.message.created';

interface ApplicationChatMessageCreatedPayload extends Message {
	conversation?: {
		conversationId?: string;
		applicationId?: string;
		kindergartenId?: string;
		parentId?: string;
	};
}

const ApplicationChatPanel = ({ applicationId, title = 'Application chat', onClose }: Props) => {
	const user = useReactiveVar(userVar);
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const [messageText, setMessageText] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const [getOrCreateConversation, { loading: creatingConversation }] = useMutation(GET_OR_CREATE_APPLICATION_CONVERSATION);
	const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_MESSAGE);
	const [markConversationRead] = useMutation(MARK_CONVERSATION_READ);

	const messagesInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'createdAt',
			direction: Direction.ASC,
			search: {
				conversationId: conversation?._id || '',
			},
		}),
		[conversation?._id],
	);

	const {
		data: messagesData,
		loading: loadingMessages,
		error: messagesError,
		refetch: refetchMessages,
	} = useQuery(GET_MESSAGES, {
		variables: { input: messagesInput },
		fetchPolicy: 'network-only',
		skip: !conversation?._id,
	});

	const messages: Message[] = messagesData?.getMessages?.list ?? [];

	const realtimeMessageHandler = useCallback(
		(payload: ApplicationChatMessageCreatedPayload) => {
			const payloadConversationId = payload?.conversationId || payload?.conversation?.conversationId;
			if (!conversation?._id || payloadConversationId !== conversation._id) return;

			void refetchMessages().catch(() => undefined);
			void markConversationRead({ variables: { conversationId: conversation._id } }).catch(() => undefined);
		},
		[conversation?._id, markConversationRead, refetchMessages],
	);

	useRealtimeEvent<ApplicationChatMessageCreatedPayload>(
		APPLICATION_CHAT_MESSAGE_CREATED_EVENT,
		realtimeMessageHandler,
		Boolean(user?._id && conversation?._id),
	);

	useEffect(() => {
		if (messagesError) setErrorMessage(messagesError.message);
	}, [messagesError]);

	useEffect(() => {
		let mounted = true;

		const openConversation = async () => {
			if (!applicationId) return;
			setErrorMessage('');

			try {
				const result = await getOrCreateConversation({ variables: { applicationId } });
				const nextConversation = result.data?.getOrCreateApplicationConversation;
				if (!mounted || !nextConversation?._id) return;

				setConversation(nextConversation);
				await markConversationRead({ variables: { conversationId: nextConversation._id } });
			} catch (err: any) {
				if (mounted) setErrorMessage(err?.message || 'Could not open application chat.');
			}
		};

		openConversation();
		return () => {
			mounted = false;
		};
	}, [applicationId, getOrCreateConversation, markConversationRead]);

	const sendMessageHandler = async () => {
		const text = messageText.trim();
		if (!conversation?._id) return;
		if (!text) {
			setErrorMessage('Message cannot be empty.');
			return;
		}
		if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
			setErrorMessage('Message must be 2000 characters or fewer.');
			return;
		}

		try {
			setErrorMessage('');
			await sendMessage({
				variables: {
					input: {
						conversationId: conversation._id,
						text,
					},
				},
			});
			setMessageText('');
			await refetchMessages();
			await markConversationRead({ variables: { conversationId: conversation._id } });
		} catch (err: any) {
			setErrorMessage(err?.message || 'Could not send message.');
		}
	};

	return (
		<Stack
			spacing={1.5}
			sx={{
				mt: 2,
				p: 2,
				border: '1px solid #d9e6dd',
				borderRadius: '12px',
				background: '#fbfff8',
				width: '100%',
				boxSizing: 'border-box',
			}}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
				<Typography sx={{ fontWeight: 700, color: '#24332d' }}>{title}</Typography>
				{onClose && (
					<Button size="small" variant="outlined" onClick={onClose}>
						Close
					</Button>
				)}
			</Stack>

			{(creatingConversation || loadingMessages) && (
				<Typography sx={{ fontSize: '13px', color: '#64746b' }}>Loading chat...</Typography>
			)}
			{errorMessage && <Typography sx={{ fontSize: '13px', color: '#b42318' }}>{errorMessage}</Typography>}

			<Stack spacing={1} sx={{ maxHeight: 260, overflowY: 'auto' }}>
				{!loadingMessages && messages.length === 0 && (
					<Typography sx={{ fontSize: '13px', color: '#64746b' }}>No messages yet.</Typography>
				)}
				{messages.map((message) => {
					const isOwnMessage = message.senderId === user._id;
					return (
						<Stack
							key={message._id}
							spacing={0.25}
							sx={{
								alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
								maxWidth: '85%',
								p: '8px 10px',
								borderRadius: '10px',
								background: isOwnMessage ? '#e7f5ec' : '#fff',
								border: '1px solid #e5eee8',
								overflowWrap: 'anywhere',
							}}
						>
							<Typography sx={{ fontSize: '13px', color: '#24332d' }}>{message.text}</Typography>
							<Typography sx={{ fontSize: '11px', color: '#8b9a90' }}>{formatDate(message.createdAt)}</Typography>
						</Stack>
					);
				})}
			</Stack>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
				<TextField
					fullWidth
					size="small"
					value={messageText}
					inputProps={{ maxLength: MAX_CHAT_MESSAGE_LENGTH }}
					placeholder="Type a message"
					onChange={(event) => setMessageText(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							sendMessageHandler();
						}
					}}
				/>
				<Button
					variant="contained"
					disabled={!conversation?._id || sendingMessage || creatingConversation}
					onClick={sendMessageHandler}
					sx={{ minWidth: 110, backgroundColor: '#2f7d4a' }}
				>
					Send
				</Button>
			</Stack>
		</Stack>
	);
};

export default ApplicationChatPanel;
