import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Avatar,
	Box,
	Button,
	CircularProgress,
	IconButton,
	Stack,
	TextField,
	Typography,
	useMediaQuery,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useRouter } from 'next/router';
import {
	GET_CONVERSATION,
	GET_MESSAGES,
	GET_MY_CONVERSATIONS,
	GET_PARENT_TEACHER_CONVERSATION,
	GET_PARENT_TEACHER_MESSAGES,
} from '../../../apollo/chat/query';
import {
	CHAT_IMAGES_UPLOADER,
	MARK_CONVERSATION_READ,
	MARK_PARENT_TEACHER_CONVERSATION_READ,
	SEND_MESSAGE,
	SEND_PARENT_TEACHER_MESSAGE,
	TRANSLATE_CHAT_MESSAGE,
} from '../../../apollo/chat/mutation';
import { userVar } from '../../../apollo/store';
import { getImageUrl } from '../../config';
import { ConversationType } from '../../enums/chat.enum';
import { Direction } from '../../enums/common.enum';
import { useRealtimeEvent } from '../../hooks/useRealtimeEvent';
import { MyConversationSummary } from '../../types/chat/conversation';
import { ChatAttachment, Message, TranslateChatMessageInput, TranslatedMessage } from '../../types/chat/message';
import ChatImagePreview from './ChatImagePreview';
import { useTranslation } from 'next-i18next';
import { CHAT_IMAGE_ACCEPT, compressChatImageFiles, MAX_CHAT_IMAGES, toChatAttachmentInput } from './chatImageAttachments';

const APPLICATION_CHAT_MESSAGE_CREATED_EVENT = 'application_chat.message.created';
const PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT = 'parent_teacher_chat.message.created';
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const SUPPORTED_TRANSLATION_LANGS = ['en', 'ko', 'ru', 'uz'] as const;

type TranslationTargetLang = (typeof SUPPORTED_TRANSLATION_LANGS)[number];
type MessageTranslationState = {
	loading?: boolean;
	translatedText?: string;
	targetLang?: TranslationTargetLang;
	hidden?: boolean;
	error?: boolean;
	unavailable?: boolean;
};

interface ChatMessageCreatedPayload extends Message {
	conversation?: {
		conversationId?: string;
	};
}

const conversationsInput = {
	page: 1,
	limit: 50,
};

const messagesPageStyle: React.CSSProperties = {
	minHeight: 'calc(100vh - 120px)',
	padding: '104px 24px 64px',
	background:
		'radial-gradient(circle at 12% 10%, rgba(255, 206, 87, 0.18), transparent 24%), linear-gradient(180deg, #fffaf2 0%, #f5f9ef 100%)',
	boxSizing: 'border-box',
};

const formatConversationTime = (value?: Date | string | null, locale = 'en'): string => {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	const now = new Date();
	const sameDay = date.toDateString() === now.toDateString();
	if (sameDay) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

	return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
};

const formatMessageTime = (value?: Date | string | null, locale = 'en'): string => {
	if (!value) return '';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	return date.toLocaleString(locale, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const getInitial = (title?: string): string => {
	const value = title?.trim();
	return value ? value.charAt(0).toUpperCase() : 'C';
};

const getPayloadConversationId = (payload: ChatMessageCreatedPayload): string | undefined =>
	payload?.conversationId || payload?.conversation?.conversationId;

const getTranslationTargetLang = (locale?: string): TranslationTargetLang | null => {
	const normalized = String(locale || 'en').toLowerCase();
	const mappedLocale = normalized === 'kr' ? 'ko' : normalized;
	return SUPPORTED_TRANSLATION_LANGS.includes(mappedLocale as TranslationTargetLang)
		? (mappedLocale as TranslationTargetLang)
		: null;
};

const MessagesPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const locale = router.locale === 'kr' ? 'ko' : router.locale || 'en';
	const user = useReactiveVar(userVar);
	const isCompact = useMediaQuery('(max-width: 900px)');
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [search, setSearch] = useState('');
	const [selectedConversationId, setSelectedConversationId] = useState('');
	const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
	const [messageText, setMessageText] = useState('');
	const [selectedImages, setSelectedImages] = useState<File[]>([]);
	const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);
	const [errorMessage, setErrorMessage] = useState('');
	const [messageTranslations, setMessageTranslations] = useState<Record<string, MessageTranslationState>>({});
	const translationTargetLang = getTranslationTargetLang(router.locale);

	const {
		data: conversationsData,
		loading: conversationsLoading,
		error: conversationsError,
		refetch: refetchConversations,
	} = useQuery(GET_MY_CONVERSATIONS, {
		variables: { input: conversationsInput },
		skip: !user?._id,
		fetchPolicy: 'network-only',
	});

	const conversations: MyConversationSummary[] = conversationsData?.getMyConversations?.list ?? [];

	const selectedConversation = useMemo(
		() => conversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null,
		[conversations, selectedConversationId],
	);

	const isApplicationChat = selectedConversation?.conversationType === ConversationType.APPLICATION_CHAT;
	const isParentTeacherChat = selectedConversation?.conversationType === ConversationType.PARENT_TEACHER_CHAT;

	const messagesInput = useMemo(
		() => ({
			page: 1,
			limit: 100,
			sort: 'createdAt',
			direction: Direction.ASC,
			search: {
				conversationId: selectedConversationId,
			},
		}),
		[selectedConversationId],
	);

	const {
		loading: loadingApplicationConversation,
		error: applicationConversationError,
	} = useQuery(GET_CONVERSATION, {
		variables: { conversationId: selectedConversationId },
		skip: !selectedConversationId || !isApplicationChat,
		fetchPolicy: 'network-only',
	});

	const {
		loading: loadingParentTeacherConversation,
		error: parentTeacherConversationError,
	} = useQuery(GET_PARENT_TEACHER_CONVERSATION, {
		variables: { conversationId: selectedConversationId },
		skip: !selectedConversationId || !isParentTeacherChat,
		fetchPolicy: 'network-only',
	});

	const {
		data: applicationMessagesData,
		loading: loadingApplicationMessages,
		error: applicationMessagesError,
		refetch: refetchApplicationMessages,
	} = useQuery(GET_MESSAGES, {
		variables: { input: messagesInput },
		skip: !selectedConversationId || !isApplicationChat,
		fetchPolicy: 'network-only',
	});

	const {
		data: parentTeacherMessagesData,
		loading: loadingParentTeacherMessages,
		error: parentTeacherMessagesError,
		refetch: refetchParentTeacherMessages,
	} = useQuery(GET_PARENT_TEACHER_MESSAGES, {
		variables: { input: messagesInput },
		skip: !selectedConversationId || !isParentTeacherChat,
		fetchPolicy: 'network-only',
	});

	const [sendApplicationMessage, { loading: sendingApplicationMessage }] = useMutation(SEND_MESSAGE);
	const [sendParentTeacherMessage, { loading: sendingParentTeacherMessage }] = useMutation(SEND_PARENT_TEACHER_MESSAGE);
	const [uploadChatImages, { loading: uploadingImages }] = useMutation(CHAT_IMAGES_UPLOADER);
	const [markApplicationConversationRead] = useMutation(MARK_CONVERSATION_READ);
	const [markParentTeacherConversationRead] = useMutation(MARK_PARENT_TEACHER_CONVERSATION_READ);
	const [translateChatMessage] = useMutation<{ translateChatMessage: TranslatedMessage }, { input: TranslateChatMessageInput }>(
		TRANSLATE_CHAT_MESSAGE,
	);

	const messages: Message[] = isApplicationChat
		? applicationMessagesData?.getMessages?.list ?? []
		: parentTeacherMessagesData?.getParentTeacherMessages?.list ?? [];

	const loadingThread =
		loadingApplicationConversation ||
		loadingParentTeacherConversation ||
		loadingApplicationMessages ||
		loadingParentTeacherMessages;
	const threadError =
		applicationConversationError ||
		parentTeacherConversationError ||
		applicationMessagesError ||
		parentTeacherMessagesError;
	const sendingMessage = sendingApplicationMessage || sendingParentTeacherMessage || uploadingImages;

	const filteredConversations = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return conversations;

		return conversations.filter((conversation) =>
			[conversation.title, conversation.subtitle, conversation.participantLabel, conversation.lastMessage]
				.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
				.some((value) => value.toLowerCase().includes(query)),
		);
	}, [conversations, search]);

	const refetchActiveMessages = useCallback(async () => {
		if (!selectedConversationId) return;
		if (isApplicationChat) {
			await refetchApplicationMessages({ input: messagesInput }).catch(() => undefined);
			return;
		}
		if (isParentTeacherChat) {
			await refetchParentTeacherMessages({ input: messagesInput }).catch(() => undefined);
		}
	}, [
		isApplicationChat,
		isParentTeacherChat,
		messagesInput,
		refetchApplicationMessages,
		refetchParentTeacherMessages,
		selectedConversationId,
	]);

	const markSelectedConversationRead = useCallback(async () => {
		if (!selectedConversationId || !selectedConversation) return;
		if (isApplicationChat) {
			await markApplicationConversationRead({ variables: { conversationId: selectedConversationId } }).catch(() => undefined);
		} else if (isParentTeacherChat) {
			await markParentTeacherConversationRead({ variables: { conversationId: selectedConversationId } }).catch(() => undefined);
		}
		await refetchConversations({ input: conversationsInput }).catch(() => undefined);
	}, [
		isApplicationChat,
		isParentTeacherChat,
		markApplicationConversationRead,
		markParentTeacherConversationRead,
		refetchConversations,
		selectedConversation,
		selectedConversationId,
	]);

	useEffect(() => {
		const queryConversationId = typeof router.query.conversationId === 'string' ? router.query.conversationId : '';
		if (!queryConversationId || !conversations.length) return;
		const exists = conversations.some((conversation) => conversation.conversationId === queryConversationId);
		if (exists) {
			setSelectedConversationId(queryConversationId);
			setMobileThreadOpen(true);
		}
	}, [conversations, router.query.conversationId]);

	useEffect(() => {
		if (!selectedConversationId) return;
		void markSelectedConversationRead();
	}, [markSelectedConversationRead, selectedConversationId]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}, [messages.length, selectedConversationId]);

	const realtimeHandler = useCallback(
		(payload: ChatMessageCreatedPayload) => {
			const payloadConversationId = getPayloadConversationId(payload);
			void refetchConversations({ input: conversationsInput }).catch(() => undefined);
			if (payloadConversationId && payloadConversationId === selectedConversationId) {
				void refetchActiveMessages();
				void markSelectedConversationRead();
			}
		},
		[markSelectedConversationRead, refetchActiveMessages, refetchConversations, selectedConversationId],
	);

	useRealtimeEvent<ChatMessageCreatedPayload>(APPLICATION_CHAT_MESSAGE_CREATED_EVENT, realtimeHandler, Boolean(user?._id));
	useRealtimeEvent<ChatMessageCreatedPayload>(PARENT_TEACHER_CHAT_MESSAGE_CREATED_EVENT, realtimeHandler, Boolean(user?._id));

	const selectConversationHandler = async (conversation: MyConversationSummary) => {
		setSelectedConversationId(conversation.conversationId);
		setMobileThreadOpen(true);
		setErrorMessage('');
		setSelectedImages([]);
		await router.replace(
			{
				pathname: '/messages',
				query: { conversationId: conversation.conversationId },
			},
			undefined,
			{ shallow: true },
		);
	};

	const backToListHandler = async () => {
		setMobileThreadOpen(false);
		if (isCompact) {
			await router.replace('/messages', undefined, { shallow: true });
		}
	};

	const imageSelectHandler = async (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		event.target.value = '';
		if (!files.length) return;

		try {
			setErrorMessage('');
			const compressedFiles = await compressChatImageFiles(files);
			setSelectedImages(compressedFiles);
		} catch (err: any) {
			setErrorMessage(err?.message || t('messages.prepareImagesError'));
			setSelectedImages([]);
		}
	};

	const removeSelectedImage = (index: number) => {
		setSelectedImages((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
	};

	const showOriginalHandler = (messageId: string) => {
		setMessageTranslations((prev) => ({
			...prev,
			[messageId]: {
				...prev[messageId],
				hidden: true,
				error: false,
				unavailable: false,
				loading: false,
			},
		}));
	};

	const translateMessageHandler = async (message: Message) => {
		const text = message.text?.trim();
		if (!text) return;

		const existingTranslation = messageTranslations[message._id];
		if (existingTranslation?.translatedText && existingTranslation.hidden) {
			setMessageTranslations((prev) => ({
				...prev,
				[message._id]: {
					...prev[message._id],
					hidden: false,
					error: false,
					unavailable: false,
				},
			}));
			return;
		}

		if (!selectedConversation?.conversationType || !translationTargetLang) {
			setMessageTranslations((prev) => ({
				...prev,
				[message._id]: {
					...prev[message._id],
					loading: false,
					error: true,
					unavailable: true,
				},
			}));
			return;
		}

		try {
			setMessageTranslations((prev) => ({
				...prev,
				[message._id]: {
					...prev[message._id],
					loading: true,
					error: false,
					unavailable: false,
					hidden: false,
				},
			}));

			const result = await translateChatMessage({
				variables: {
					input: {
						conversationType: selectedConversation.conversationType,
						messageId: message._id,
						targetLang: translationTargetLang,
					},
				},
			});

			const translatedText = result.data?.translateChatMessage?.translatedText?.trim();
			if (!translatedText) throw new Error(t('messages.translationFailed'));

			setMessageTranslations((prev) => ({
				...prev,
				[message._id]: {
					loading: false,
					error: false,
					unavailable: false,
					hidden: false,
					targetLang: translationTargetLang,
					translatedText,
				},
			}));
		} catch (err) {
			setMessageTranslations((prev) => ({
				...prev,
				[message._id]: {
					...prev[message._id],
					loading: false,
					error: true,
					unavailable: false,
				},
			}));
		}
	};

	const sendMessageHandler = async () => {
		const text = messageText.trim();
		if (!selectedConversation || !selectedConversationId) return;
		if (!text && !selectedImages.length) {
			setErrorMessage(t('messages.emptyMessageError'));
			return;
		}
		if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
			setErrorMessage(t('messages.tooLongError'));
			return;
		}

		try {
			setErrorMessage('');
			let attachments: ChatAttachment[] = [];
			if (selectedImages.length) {
				const uploadResult = await uploadChatImages({ variables: { files: selectedImages } });
				attachments = (uploadResult.data?.chatImagesUploader || []).map(toChatAttachmentInput);
				if (attachments.length !== selectedImages.length) throw new Error(t('messages.uploadImagesError'));
			}

			const variables = {
				input: {
					conversationId: selectedConversationId,
					...(text ? { text } : {}),
					...(attachments.length ? { attachments } : {}),
				},
			};

			if (isApplicationChat) {
				await sendApplicationMessage({ variables });
			} else {
				await sendParentTeacherMessage({ variables });
			}

			setMessageText('');
			setSelectedImages([]);
			await refetchActiveMessages();
			await markSelectedConversationRead();
			await refetchConversations({ input: conversationsInput }).catch(() => undefined);
		} catch (err: any) {
			setErrorMessage(err?.message || t('messages.sendError'));
		}
	};

	const openContextHandler = async () => {
		if (!selectedConversation?.targetRoute) return;
		await router.push(selectedConversation.targetRoute);
	};

	const listVisible = !isCompact || !mobileThreadOpen;
	const threadVisible = !isCompact || mobileThreadOpen;
	const messagesLayoutStyle: React.CSSProperties = {
		display: 'grid',
		gridTemplateColumns: isCompact ? '1fr' : '360px minmax(0, 1fr)',
		gap: 16,
		alignItems: 'stretch',
		minHeight: isCompact ? 560 : 680,
	};

	return (
		<div
			className="messages-page"
			style={messagesPageStyle}
		>
			<Stack
				className="messages-shell"
				spacing={2.5}
				sx={{
					width: '100%',
					maxWidth: 1180,
					mx: 'auto',
				}}
			>
				<Stack spacing={0.75}>
					<Typography sx={{ color: '#2f7d4a', fontSize: 12, fontWeight: 900, letterSpacing: '0.08em' }}>
						{t('messages.eyebrow')}
					</Typography>
					<Typography component="h1" sx={{ m: 0, color: '#24332d', fontSize: { xs: 28, md: 38 }, fontWeight: 900 }}>
						{t('messages.title')}
					</Typography>
					<Typography sx={{ color: '#64746b', fontSize: 15 }}>
						{t('messages.subtitle')}
					</Typography>
				</Stack>

				<div
					className="messages-layout"
					style={messagesLayoutStyle}
				>
					{listVisible && (
						<Stack
							className="messages-list-panel"
							sx={{
								minHeight: { xs: 540, md: 680 },
								border: '1px solid #dfe9d7',
								borderRadius: 4,
								background: 'rgba(255,255,255,0.9)',
								boxShadow: '0 18px 42px rgba(36, 51, 45, 0.1)',
								overflow: 'hidden',
							}}
						>
							<Stack spacing={1.5} sx={{ p: 2, borderBottom: '1px solid #edf2e8' }}>
								<Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
									<Typography sx={{ color: '#24332d', fontSize: 18, fontWeight: 900 }}>{t('messages.chats')}</Typography>
									<Typography sx={{ color: '#6f8177', fontSize: 12, fontWeight: 800 }}>
										{conversationsData?.getMyConversations?.total ?? 0} {t('messages.total')}
									</Typography>
								</Stack>
								<TextField
									fullWidth
									size="small"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder={t('messages.searchPlaceholder')}
									InputProps={{
										startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: '#7d8d84', fontSize: 19 }} />,
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: '999px',
											background: '#fffdf8',
											fontSize: 14,
										},
									}}
								/>
							</Stack>

							<Stack spacing={1} sx={{ p: 1.5, overflowY: 'auto', flex: 1 }}>
								{conversationsLoading && (
									<Stack direction="row" alignItems="center" gap={1} sx={{ p: 2 }}>
										<CircularProgress size={18} />
										<Typography sx={{ color: '#64746b', fontSize: 13 }}>{t('messages.loadingConversations')}</Typography>
									</Stack>
								)}
								{conversationsError && (
									<Typography sx={{ p: 2, color: '#b42318', fontSize: 13 }}>{t('messages.conversationsError')}</Typography>
								)}
								{!conversationsLoading && !conversationsError && filteredConversations.length === 0 && (
									<Stack
										alignItems="center"
										justifyContent="center"
										spacing={0.75}
										sx={{
											minHeight: 180,
											border: '1px dashed #cfe0c8',
											borderRadius: 3,
											background: '#fffaf2',
											textAlign: 'center',
											px: 2,
										}}
									>
										<Typography sx={{ color: '#24332d', fontWeight: 900 }}>{t('messages.emptyTitle')}</Typography>
										<Typography sx={{ color: '#64746b', fontSize: 13 }}>
											{t('messages.emptyText')}
										</Typography>
									</Stack>
								)}
								{filteredConversations.map((conversation) => {
									const active = selectedConversationId === conversation.conversationId;
									return (
										<Box
											key={conversation.conversationId}
											component="button"
											type="button"
											onClick={() => selectConversationHandler(conversation)}
											sx={{
												width: '100%',
												p: 1.25,
												border: active ? '1px solid #9ed3a5' : '1px solid transparent',
												borderRadius: 3,
												background: active ? '#eef9ec' : conversation.unreadCount > 0 ? '#f5fbf1' : '#ffffff',
												textAlign: 'left',
												cursor: 'pointer',
												transition: 'all 0.16s ease',
												'&:hover': { borderColor: '#cfe7d3', background: '#f7fcf4' },
												'&:focus-visible': {
													outline: '2px solid #2f7d4a',
													outlineOffset: 2,
												},
											}}
										>
											<Stack direction="row" gap={1.25} alignItems="flex-start">
												<Avatar
													src={conversation.avatar ? getImageUrl(conversation.avatar) : undefined}
													alt={conversation.title}
													sx={{ width: 42, height: 42, bgcolor: '#e3f2df', color: '#2f7d4a', fontWeight: 900 }}
												>
													{getInitial(conversation.title)}
												</Avatar>
												<Stack sx={{ minWidth: 0, flex: 1 }} gap={0.35}>
													<Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
														<Typography
															sx={{
																color: '#24332d',
																fontSize: 14,
																fontWeight: 900,
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
															}}
														>
															{conversation.title}
														</Typography>
														<Typography sx={{ color: '#9ca3af', fontSize: 11, flexShrink: 0 }}>
															{formatConversationTime(conversation.lastMessageAt, locale)}
														</Typography>
													</Stack>
													<Typography sx={{ color: '#64746b', fontSize: 12 }}>
														{conversation.subtitle || conversation.participantLabel || t(`messages.conversationTypes.${conversation.conversationType}`, t('messages.privateChat'))}
													</Typography>
													<Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
														<Typography
															sx={{
																color: '#7d8d84',
																fontSize: 12,
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
																minWidth: 0,
															}}
														>
															{conversation.lastMessage || t('messages.noMessagesYet')}
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
																	fontSize: 11,
																	fontWeight: 900,
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
									);
								})}
							</Stack>
						</Stack>
					)}

					{threadVisible && (
						<Stack
							className="messages-thread-panel"
							sx={{
								minHeight: { xs: 540, md: 680 },
								border: '1px solid #dfe9d7',
								borderRadius: 4,
								background: 'rgba(255,255,255,0.92)',
								boxShadow: '0 18px 42px rgba(36, 51, 45, 0.1)',
								overflow: 'hidden',
							}}
						>
							{!selectedConversation ? (
								<Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ flex: 1, p: 3, textAlign: 'center' }}>
									<Avatar sx={{ width: 64, height: 64, bgcolor: '#e3f2df', color: '#2f7d4a', fontWeight: 900 }}>
										KG
									</Avatar>
									<Typography sx={{ color: '#24332d', fontSize: 24, fontWeight: 900 }}>{t('messages.yourMessages')}</Typography>
									<Typography sx={{ maxWidth: 360, color: '#64746b', fontSize: 14 }}>
										{t('messages.selectConversation')}
									</Typography>
								</Stack>
							) : (
								<>
									<Stack
										direction="row"
										alignItems="center"
										justifyContent="space-between"
										gap={1.5}
										sx={{ p: 2, borderBottom: '1px solid #edf2e8', background: '#fffdf8' }}
									>
										<Stack direction="row" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
											{isCompact && (
												<IconButton aria-label={t('messages.backToConversations')} size="small" onClick={backToListHandler}>
													<ArrowBackRoundedIcon />
												</IconButton>
											)}
											<Avatar
												src={selectedConversation.avatar ? getImageUrl(selectedConversation.avatar) : undefined}
												alt={selectedConversation.title}
												sx={{ width: 42, height: 42, bgcolor: '#e3f2df', color: '#2f7d4a', fontWeight: 900 }}
											>
												{getInitial(selectedConversation.title)}
											</Avatar>
											<Stack sx={{ minWidth: 0 }}>
												<Typography
													sx={{
														color: '#24332d',
														fontSize: 16,
														fontWeight: 900,
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
												>
													{selectedConversation.title}
												</Typography>
												<Typography sx={{ color: '#64746b', fontSize: 12 }}>
													{selectedConversation.subtitle || selectedConversation.participantLabel || t(`messages.conversationTypes.${selectedConversation.conversationType}`, t('messages.privateChat'))}
												</Typography>
											</Stack>
										</Stack>
										{selectedConversation.targetRoute && (
											<Button
												size="small"
												variant="outlined"
												onClick={openContextHandler}
												sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 800, flexShrink: 0 }}
											>
												{t('messages.viewContext')}
											</Button>
										)}
									</Stack>

									<Stack sx={{ flex: 1, minHeight: 0 }}>
										<Stack spacing={1.25} sx={{ flex: 1, p: 2, overflowY: 'auto', background: '#fbfff8' }}>
											{loadingThread && (
												<Stack direction="row" alignItems="center" justifyContent="center" gap={1} sx={{ py: 4 }}>
													<CircularProgress size={18} />
													<Typography sx={{ color: '#64746b', fontSize: 13 }}>{t('messages.loadingMessages')}</Typography>
												</Stack>
											)}
											{threadError && (
												<Typography sx={{ color: '#b42318', fontSize: 13 }}>{t('messages.messagesError')}</Typography>
											)}
											{!loadingThread && !threadError && messages.length === 0 && (
												<Stack
													alignItems="center"
													justifyContent="center"
													spacing={0.75}
													sx={{ minHeight: 220, color: '#64746b', textAlign: 'center' }}
												>
													<Typography sx={{ color: '#24332d', fontWeight: 900 }}>{t('messages.noMessagesYet')}</Typography>
													<Typography sx={{ fontSize: 13 }}>{t('messages.sendFirstMessage')}</Typography>
												</Stack>
											)}
											{messages.map((message) => {
												const isOwnMessage = message.senderId === user._id;
												const hasText = Boolean(message.text?.trim());
												const translationState = messageTranslations[message._id];
												const translatedTextVisible = Boolean(translationState?.translatedText && !translationState.hidden);
												const visibleMessageText = translatedTextVisible ? translationState?.translatedText : message.text;
												return (
													<Stack
														key={message._id}
														spacing={0.5}
														alignItems={isOwnMessage ? 'flex-end' : 'flex-start'}
														sx={{ width: '100%' }}
													>
														<Stack
															spacing={0.75}
															sx={{
																maxWidth: { xs: '88%', md: '68%' },
																p: '10px 12px',
																borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
																background: isOwnMessage ? '#e8f6ec' : '#ffffff',
																border: isOwnMessage ? '1px solid #cfe7d3' : '1px solid #e5eee8',
																boxShadow: '0 8px 18px rgba(72, 101, 79, 0.06)',
																overflowWrap: 'anywhere',
															}}
														>
															{translatedTextVisible && (
																<Typography sx={{ color: '#2f7d4a', fontSize: 11, fontWeight: 900, letterSpacing: '0.03em' }}>
																	{t('messages.translated')}
																</Typography>
															)}
															{visibleMessageText && (
																<Typography sx={{ color: '#24332d', fontSize: 14, lineHeight: 1.5 }}>
																	{visibleMessageText}
																</Typography>
															)}
															{Boolean(message.attachments?.length) && (
																<Stack spacing={0.75}>
																	{message.attachments?.map((attachment) => (
																		<Box
																			key={`${message._id}-${attachment.url}`}
																			component="img"
																			src={getImageUrl(attachment.url)}
																			alt={attachment.name || t('messages.chatImageAlt')}
																			onClick={() =>
																				setPreviewImage({
																					url: getImageUrl(attachment.url),
																					alt: attachment.name || t('messages.chatImagePreviewAlt'),
																				})
																			}
																			sx={{
																				display: 'block',
																				maxWidth: { xs: 210, md: 260 },
																				maxHeight: 220,
																				borderRadius: 2,
																				objectFit: 'cover',
																				border: '1px solid #dce7df',
																				cursor: 'pointer',
																			}}
																		/>
																	))}
																</Stack>
															)}
														</Stack>
														{hasText && (
															<Stack
																direction="row"
																alignItems="center"
																gap={0.75}
																flexWrap="wrap"
																sx={{
																	maxWidth: { xs: '88%', md: '68%' },
																	justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
																}}
															>
																{translationState?.loading ? (
																	<Typography sx={{ color: '#6f7f73', fontSize: 11.5, fontWeight: 700 }}>
																		{t('messages.translating')}
																	</Typography>
																) : translatedTextVisible ? (
																	<Button
																		type="button"
																		size="small"
																		onClick={() => showOriginalHandler(message._id)}
																		sx={{
																			minWidth: 0,
																			p: '2px 0',
																			color: '#2f7d4a',
																			fontSize: 11.5,
																			fontWeight: 800,
																			textTransform: 'none',
																			'&:hover': { background: 'transparent', color: '#166534' },
																		}}
																	>
																		{t('messages.showOriginal')}
																	</Button>
																) : (
																	<Button
																		type="button"
																		size="small"
																		onClick={() => translateMessageHandler(message)}
																		sx={{
																			minWidth: 0,
																			p: '2px 0',
																			color: '#2f7d4a',
																			fontSize: 11.5,
																			fontWeight: 800,
																			textTransform: 'none',
																			'&:hover': { background: 'transparent', color: '#166534' },
																		}}
																	>
																		{t('messages.translate')}
																	</Button>
																)}
																{translationState?.error && (
																	<Typography sx={{ color: '#b42318', fontSize: 11.5, fontWeight: 700 }}>
																		{translationState.unavailable
																			? t('messages.translationUnavailable')
																			: t('messages.translationFailed')}
																	</Typography>
																)}
															</Stack>
														)}
														<Typography sx={{ color: '#9ca3af', fontSize: 11 }}>{formatMessageTime(message.createdAt, locale)}</Typography>
													</Stack>
												);
											})}
											<div ref={messagesEndRef} />
										</Stack>

										<Stack spacing={1} sx={{ p: 2, borderTop: '1px solid #edf2e8', background: '#fffdf8' }}>
											{errorMessage && <Typography sx={{ color: '#b42318', fontSize: 13 }}>{errorMessage}</Typography>}
											{Boolean(selectedImages.length) && (
												<Stack spacing={0.75}>
													{selectedImages.map((file, index) => (
														<Stack
															key={`${file.name}-${file.size}-${index}`}
															direction="row"
															alignItems="center"
															justifyContent="space-between"
															gap={1}
															sx={{
																p: '8px 10px',
																border: '1px solid #edf2e8',
																borderRadius: 2,
																background: '#fff',
															}}
														>
															<Typography sx={{ color: '#4b5d52', fontSize: 12, overflowWrap: 'anywhere' }}>
																{file.name} ({Math.ceil(file.size / 1024)} KB)
															</Typography>
															<Button size="small" variant="text" onClick={() => removeSelectedImage(index)}>
																{t('messages.remove')}
															</Button>
														</Stack>
													))}
												</Stack>
											)}
											<Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems="stretch">
												<TextField
													fullWidth
													size="small"
													value={messageText}
													inputProps={{ maxLength: MAX_CHAT_MESSAGE_LENGTH }}
													placeholder={t('messages.typeMessage')}
													onChange={(event) => setMessageText(event.target.value)}
													onKeyDown={(event) => {
														if (event.key === 'Enter' && !event.shiftKey) {
															event.preventDefault();
															sendMessageHandler();
														}
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															borderRadius: '999px',
															background: '#ffffff',
														},
													}}
												/>
												<input
													ref={fileInputRef}
													type="file"
													hidden
													multiple
													accept={CHAT_IMAGE_ACCEPT}
													onChange={imageSelectHandler}
												/>
												<Button
													variant="outlined"
													disabled={!selectedConversation || sendingMessage}
													onClick={() => fileInputRef.current?.click()}
													startIcon={<ImageOutlinedIcon />}
													sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 900, minWidth: 118 }}
												>
													{t('messages.images')}
												</Button>
												<Button
													variant="contained"
													disabled={!selectedConversation || sendingMessage}
													onClick={sendMessageHandler}
													endIcon={<SendRoundedIcon />}
													sx={{
														borderRadius: '999px',
														textTransform: 'none',
														fontWeight: 900,
														minWidth: 112,
														background: '#2f7d4a',
														'&:hover': { background: '#276c3f' },
													}}
												>
													{uploadingImages ? t('messages.uploading') : t('messages.send')}
												</Button>
											</Stack>
											<Typography sx={{ color: '#8b9a90', fontSize: 11 }}>
												{t('messages.imageHelp', { count: MAX_CHAT_IMAGES })}
											</Typography>
										</Stack>
									</Stack>
								</>
							)}
						</Stack>
					)}
				</div>
			</Stack>

			<ChatImagePreview
				open={Boolean(previewImage)}
				imageUrl={previewImage?.url}
				alt={previewImage?.alt}
				onClose={() => setPreviewImage(null)}
			/>
		</div>
	);
};

export default MessagesPage;
