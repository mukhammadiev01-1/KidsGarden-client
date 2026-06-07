import { getJwtToken } from '../auth';

type RealtimeEventHandler<TPayload = unknown> = (payload: TPayload) => void;

interface RealtimeEnvelope<TPayload = unknown> {
	event?: string;
	payload?: TPayload;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 15000;

class RealtimeClient {
	private socket: WebSocket | null = null;
	private handlers = new Map<string, Set<RealtimeEventHandler>>();
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectDelay = RECONNECT_DELAY_MS;
	private shouldReconnect = false;
	private state: ConnectionState = 'idle';

	public connect(): void {
		if (typeof window === 'undefined') return;

		const token = getJwtToken();
		if (!token) {
			this.disconnect();
			return;
		}

		if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
			return;
		}

		const realtimeUrl = this.getRealtimeUrl(token);
		if (!realtimeUrl) return;

		this.clearReconnectTimer();
		this.shouldReconnect = true;
		this.state = 'connecting';
		this.socket = new WebSocket(realtimeUrl);

		this.socket.onopen = () => {
			this.state = 'connected';
			this.reconnectDelay = RECONNECT_DELAY_MS;
		};

		this.socket.onmessage = (event) => this.handleMessage(event.data);

		this.socket.onerror = () => {
			this.state = 'disconnected';
		};

		this.socket.onclose = () => {
			this.socket = null;
			this.state = 'disconnected';
			if (this.shouldReconnect && getJwtToken()) this.scheduleReconnect();
		};
	}

	public disconnect(): void {
		this.shouldReconnect = false;
		this.clearReconnectTimer();

		if (this.socket) {
			this.socket.onclose = null;
			this.socket.close();
			this.socket = null;
		}

		this.state = 'idle';
	}

	public subscribe<TPayload = unknown>(eventName: string, handler: RealtimeEventHandler<TPayload>): () => void {
		const eventHandlers = this.handlers.get(eventName) ?? new Set<RealtimeEventHandler>();
		eventHandlers.add(handler as RealtimeEventHandler);
		this.handlers.set(eventName, eventHandlers);
		this.connect();

		return () => {
			const currentHandlers = this.handlers.get(eventName);
			if (!currentHandlers) return;

			currentHandlers.delete(handler as RealtimeEventHandler);
			if (currentHandlers.size === 0) this.handlers.delete(eventName);
			if (this.handlers.size === 0) this.disconnect();
		};
	}

	public getState(): ConnectionState {
		return this.state;
	}

	private handleMessage(rawMessage: string): void {
		let envelope: RealtimeEnvelope;

		try {
			envelope = JSON.parse(rawMessage);
		} catch {
			return;
		}

		if (!envelope.event) return;

		const eventHandlers = this.handlers.get(envelope.event);
		if (!eventHandlers?.size) return;

		eventHandlers.forEach((handler) => handler(envelope.payload));
	}

	private scheduleReconnect(): void {
		this.clearReconnectTimer();
		const delay = this.reconnectDelay;
		this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
		this.reconnectTimer = setTimeout(() => this.connect(), delay);
	}

	private clearReconnectTimer(): void {
		if (!this.reconnectTimer) return;
		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = null;
	}

	private getRealtimeUrl(token: string): string | null {
		const explicitWsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL || process.env.REACT_APP_REALTIME_WS_URL;
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
		const baseUrl = explicitWsUrl || apiUrl;

		if (!baseUrl) return null;

		const wsUrl = baseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
		const normalizedUrl = wsUrl.endsWith('/realtime') ? wsUrl : `${wsUrl.replace(/\/$/, '')}/realtime`;

		return `${normalizedUrl}?token=${encodeURIComponent(token)}`;
	}
}

export const realtimeClient = new RealtimeClient();
