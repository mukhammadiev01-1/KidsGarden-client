import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { ASK_AI_ASSISTANT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';

type AiMessage = {
	id: string;
	role: 'user' | 'assistant';
	text: string;
	isError?: boolean;
};

const suggestions = [
	'How do I find a kindergarten near me?',
	'How does address search work?',
	'How do messages work?',
	'What can kindergarten admins do?',
];

const maxMessageLength = 800;

const AiAssistant = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const [messages, setMessages] = useState<AiMessage[]>([]);
	const [askAiAssistant, { loading }] = useMutation(ASK_AI_ASSISTANT);

	useEffect(() => {
		if (!open) return;
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}, [messages, open, loading]);

	const buildMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

	const getFriendlyErrorMessage = (err: any) => {
		const rawMessage = String(err?.message || '');
		if (rawMessage.includes('Daily AI limit reached')) return 'Daily AI limit reached. Please try again tomorrow.';
		if (rawMessage.includes('Please wait a few seconds')) return 'Please wait a few seconds before sending another message.';
		if (rawMessage.includes('Message is too long')) return rawMessage;
		if (rawMessage.includes('AI Assistant is temporarily unavailable')) {
			return 'AI Assistant is temporarily unavailable. Please try again later.';
		}
		return 'AI Assistant is temporarily unavailable. Please try again later.';
	};

	const sendMessage = async (messageOverride?: string) => {
		const message = (messageOverride ?? inputValue).trim();
		if (!message || loading) return;

		if (message.length > maxMessageLength) {
			setMessages((prev) => [
				...prev,
				{
					id: buildMessageId(),
					role: 'assistant',
					text: `Message is too long. Please keep it under ${maxMessageLength} characters.`,
					isError: true,
				},
			]);
			return;
		}

		setInputValue('');
		setMessages((prev) => [
			...prev,
			{
				id: buildMessageId(),
				role: 'user',
				text: message,
			},
		]);

		try {
			const { data } = await askAiAssistant({
				variables: {
					input: {
						message,
						pageContext: router.asPath?.slice(0, 200),
						roleContext: user?.memberType || 'Guest',
					},
				},
			});

			const answer = data?.askAiAssistant?.answer?.trim() || 'I could not generate an answer. Please try again.';
			setMessages((prev) => [
				...prev,
				{
					id: buildMessageId(),
					role: 'assistant',
					text: answer,
				},
			]);
		} catch (err: any) {
			setMessages((prev) => [
				...prev,
				{
					id: buildMessageId(),
					role: 'assistant',
					text: getFriendlyErrorMessage(err),
					isError: true,
				},
			]);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key !== 'Enter' || event.shiftKey) return;
		event.preventDefault();
		void sendMessage();
	};

	return (
		<div className={`kg-ai-assistant ${open ? 'open' : ''}`}>
			{open && (
				<section className="kg-ai-panel" aria-label="KidsGarden AI Assistant">
					<header className="kg-ai-header">
						<div className="kg-ai-header-icon" aria-hidden="true">
							<SmartToyRoundedIcon />
						</div>
						<div>
							<strong>KidsGarden AI Assistant</strong>
							<span>Ask about using the website</span>
						</div>
						<div className="kg-ai-header-actions">
							{messages.length > 0 && (
								<button
									type="button"
									className="kg-ai-clear"
									onClick={() => {
										setMessages([]);
										setInputValue('');
									}}
								>
									Clear chat
								</button>
							)}
							<button
								type="button"
								className="kg-ai-close"
								aria-label="Close AI Assistant"
								onClick={() => setOpen(false)}
							>
								<CloseRoundedIcon />
							</button>
						</div>
					</header>

					<div className="kg-ai-messages" aria-live="polite">
						{messages.length === 0 && (
							<div className="kg-ai-empty">
								<div className="kg-ai-empty-badge">
									<AutoAwesomeRoundedIcon />
									<span>Website helper</span>
								</div>
								<p>Ask how to search, filter, message, or manage your KidsGarden account.</p>
								<div className="kg-ai-suggestions">
									{suggestions.map((suggestion) => (
										<button
											key={suggestion}
											type="button"
											onClick={() => void sendMessage(suggestion)}
											disabled={loading}
										>
											{suggestion}
										</button>
									))}
								</div>
							</div>
						)}

						{messages.map((message) => (
							<div key={message.id} className={`kg-ai-message ${message.role} ${message.isError ? 'error' : ''}`}>
								{message.text}
							</div>
						))}

						{loading && <div className="kg-ai-message assistant loading">Thinking...</div>}
						<div ref={messagesEndRef} />
					</div>

					<div className="kg-ai-input-row">
						<textarea
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask a KidsGarden question..."
							aria-label="Message KidsGarden AI Assistant"
							maxLength={maxMessageLength}
						/>
						<button
							type="button"
							aria-label="Send message"
							onClick={() => void sendMessage()}
							disabled={loading || !inputValue.trim()}
						>
							<SendRoundedIcon />
						</button>
					</div>
				</section>
			)}

			<button
				type="button"
				className="kg-ai-launcher"
				aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
				title="AI Assistant"
				onClick={() => setOpen((prev) => !prev)}
			>
				<SmartToyRoundedIcon />
				<span>AI Assistant</span>
			</button>
		</div>
	);
};

export default AiAssistant;
