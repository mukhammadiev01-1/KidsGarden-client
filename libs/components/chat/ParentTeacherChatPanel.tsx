import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { GET_PARENT_TEACHER_MESSAGES } from '../../../apollo/chat/query';
import {
	CHAT_IMAGES_UPLOADER,
	GET_OR_CREATE_PARENT_TEACHER_CONVERSATION,
	MARK_PARENT_TEACHER_CONVERSATION_READ,
	SEND_PARENT_TEACHER_MESSAGE,
} from '../../../apollo/chat/mutation';
import { userVar } from '../../../apollo/store';
import { getImageUrl } from '../../config';
import { Direction } from '../../enums/common.enum';
import { useRealtimeEvent } from '../../hooks/useRealtimeEvent';
import { Conversation } from '../../types/chat/conversation';
import { ChatAttachment, Message } from '../../types/chat/message';
import { formatDate } from '../mypage/dashboardUtils';
import ChatImagePreview from './ChatImagePreview';
import { CHAT_IMAGE_ACCEPT, compressChatImageFiles, MAX_CHAT_IMAGES, toChatAttachmentInput } from './chatImageAttachments';

interface Props {
	childId: string;
	teacherId?: string;
	title?: string;
	onClose?: () => void;
}

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT = 'parent_teacher_chat.message.created';

interface ParentTeacherChatMessageCreatedPayload extends Message {
	conversation?: {
		conversationId?: string;
		childId?: string;
		groupId?: string;
		kindergartenId?: string;
		parentId?: string;
		teacherId?: string;
	};
}

const ParentTeacherChatPanel = ({ childId, teacherId, title = 'Parent-teacher chat', onClose }: Props) => {
	const user = useReactiveVar(userVar);
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const [messageText, setMessageText] = useState('');
	const [selectedImages, setSelectedImages] = useState<File[]>([]);
	const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
	const [errorMessage, setErrorMessage] = useState('');
	const [getOrCreateConversation, { loading: creatingConversation }] = useMutation(
		GET_OR_CREATE_PARENT_TEACHER_CONVERSATION,
	);
	const [sendMessage, { loading: sendingMessage }] = useMutation(SEND_PARENT_TEACHER_MESSAGE);
	const [uploadChatImages, { loading: uploadingImages }] = useMutation(CHAT_IMAGES_UPLOADER);
	const [markConversationRead] = useMutation(MARK_PARENT_TEACHER_CONVERSATION_READ);

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
	} = useQuery(GET_PARENT_TEACHER_MESSAGES, {
		variables: { input: messagesInput },
		fetchPolicy: 'network-only',
		skip: !conversation?._id,
	});

	const messages: Message[] = messagesData?.getParentTeacherMessages?.list ?? [];

	const realtimeMessageHandler = useCallback(
		(payload: ParentTeacherChatMessageCreatedPayload) => {
			const payloadConversationId = payload?.conversationId || payload?.conversation?.conversationId;
			if (!conversation?._id || payloadConversationId !== conversation._id) return;

			void refetchMessages().catch(() => undefined);
			void markConversationRead({ variables: { conversationId: conversation._id } }).catch(() => undefined);
		},
		[conversation?._id, markConversationRead, refetchMessages],
	);

	useRealtimeEvent<ParentTeacherChatMessageCreatedPayload>(
		PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT,
		realtimeMessageHandler,
		Boolean(user?._id && conversation?._id),
	);

	useEffect(() => {
		if (messagesError) setErrorMessage(messagesError.message);
	}, [messagesError]);

	useEffect(() => {
		let mounted = true;

		const openConversation = async () => {
			if (!childId) return;
			setErrorMessage('');

			try {
				const input = {
					childId,
					...(teacherId ? { teacherId } : {}),
				};
				const result = await getOrCreateConversation({ variables: { input } });
				const nextConversation = result.data?.getOrCreateParentTeacherConversation;
				if (!mounted || !nextConversation?._id) return;

				setConversation(nextConversation);
				await markConversationRead({ variables: { conversationId: nextConversation._id } });
			} catch (err: any) {
				if (mounted) setErrorMessage(err?.message || 'Could not open parent-teacher chat.');
			}
		};

		openConversation();
		return () => {
			mounted = false;
		};
	}, [childId, getOrCreateConversation, markConversationRead, teacherId]);

	const imageSelectHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		event.target.value = '';
		if (!files.length) return;

		try {
			setErrorMessage('');
			const compressedFiles = await compressChatImageFiles(files);
			setSelectedImages(compressedFiles);
		} catch (err: any) {
			setErrorMessage(err?.message || 'Could not prepare chat images.');
			setSelectedImages([]);
		}
	};

	const removeSelectedImage = (index: number) => {
		setSelectedImages((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
	};

	const openImagePreview = (attachment: ChatAttachment) => {
		setPreviewImage({
			url: getImageUrl(attachment.url),
			alt: attachment.name || 'Chat image preview',
		});
	};

	const sendMessageHandler = async () => {
		const text = messageText.trim();
		if (!conversation?._id) return;
		if (!text && !selectedImages.length) {
			setErrorMessage('Message cannot be empty.');
			return;
		}
		if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
			setErrorMessage('Message must be 2000 characters or fewer.');
			return;
		}

		try {
			setErrorMessage('');
			let attachments: ChatAttachment[] = [];
			if (selectedImages.length) {
				const uploadResult = await uploadChatImages({ variables: { files: selectedImages } });
				attachments = (uploadResult.data?.chatImagesUploader || []).map(toChatAttachmentInput);
				if (attachments.length !== selectedImages.length) throw new Error('Could not upload all chat images.');
			}

			await sendMessage({
				variables: {
					input: {
						conversationId: conversation._id,
						...(text ? { text } : {}),
						...(attachments.length ? { attachments } : {}),
					},
				},
			});
			setMessageText('');
			setSelectedImages([]);
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
							{message.text && <Typography sx={{ fontSize: '13px', color: '#24332d' }}>{message.text}</Typography>}
							{Boolean(message.attachments?.length) && (
								<Stack spacing={0.75}>
									{message.attachments?.map((attachment) => (
										<Box
											key={`${message._id}-${attachment.url}`}
											component="img"
											src={getImageUrl(attachment.url)}
											alt={attachment.name || 'Chat image'}
											onClick={() => openImagePreview(attachment)}
											sx={{
												maxWidth: '180px',
												maxHeight: '160px',
												borderRadius: '8px',
												objectFit: 'cover',
												border: '1px solid #dce7df',
												cursor: 'pointer',
											}}
										/>
									))}
								</Stack>
							)}
							<Typography sx={{ fontSize: '11px', color: '#8b9a90' }}>{formatDate(message.createdAt)}</Typography>
						</Stack>
					);
				})}
			</Stack>

			{Boolean(selectedImages.length) && (
				<Stack spacing={0.75}>
					{selectedImages.map((file, index) => (
						<Stack
							key={`${file.name}-${file.size}-${index}`}
							direction="row"
							spacing={1}
							alignItems="center"
							justifyContent="space-between"
							sx={{ fontSize: '12px', color: '#4b5d52' }}
						>
							<Typography sx={{ fontSize: '12px', overflowWrap: 'anywhere' }}>
								{file.name} ({Math.ceil(file.size / 1024)} KB)
							</Typography>
							<Button size="small" variant="text" onClick={() => removeSelectedImage(index)}>
								Remove
							</Button>
						</Stack>
					))}
				</Stack>
			)}

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
					component="label"
					variant="outlined"
					disabled={!conversation?._id || sendingMessage || uploadingImages || creatingConversation}
					sx={{ minWidth: 120 }}
				>
					Images
					<input type="file" hidden multiple accept={CHAT_IMAGE_ACCEPT} onChange={imageSelectHandler} />
				</Button>
				<Button
					variant="contained"
					disabled={!conversation?._id || sendingMessage || uploadingImages || creatingConversation}
					onClick={sendMessageHandler}
					sx={{ minWidth: 110, backgroundColor: '#2f7d4a' }}
				>
					{uploadingImages ? 'Uploading...' : 'Send'}
				</Button>
			</Stack>
			<Typography sx={{ fontSize: '11px', color: '#8b9a90' }}>
				Up to {MAX_CHAT_IMAGES} JPG, PNG, or WEBP images. Images are compressed before upload.
			</Typography>
			<ChatImagePreview
				open={Boolean(previewImage)}
				imageUrl={previewImage?.url}
				alt={previewImage?.alt}
				onClose={() => setPreviewImage(null)}
			/>
		</Stack>
	);
};

export default ParentTeacherChatPanel;
