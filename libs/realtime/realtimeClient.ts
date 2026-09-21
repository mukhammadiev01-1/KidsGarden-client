import { getJwtToken } from '../auth';

type RealtimeEventHandler<TPayload = unknown> = (payload: TPayload) => void;

interface RealtimeEnvelope<TPayload = unknown> {
	event?: string;
	payload?: TPayload;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 15000;
// A socket rejected for auth still fires onopen before the server closes it, so
// "opened" alone is not proof of a healthy connection. Only a connection that
// survives this long counts as established and resets the backoff.
const STABLE_CONNECTION_MS = 5000;

class RealtimeClient {
	private socket: WebSocket | null = null;
	private handlers = new Map<string, Set<RealtimeEventHandler>>();
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectDelay = RECONNECT_DELAY_MS;
	private shouldReconnect = false;
	private state: ConnectionState = 'idle';
	private openedAt = 0;
	private hasConnectedBefore = false;
	private reconnectListeners = new Set<() => void>();

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
			this.openedAt = Date.now();

			// Resetting the backoff here was wrong: the gateway closes an
			// unauthenticated socket with 1008 *after* the upgrade succeeds, so a
			// permanently failing auth reset the delay every cycle and hammered the
			// server every 3s forever. Reset only once the connection proves stable.
			setTimeout(() => {
				if (this.socket && this.socket.readyState === WebSocket.OPEN) {
					this.reconnectDelay = RECONNECT_DELAY_MS;
				}
			}, STABLE_CONNECTION_MS);

			// Events published while we were disconnected are not replayed, so tell
			// consumers to refetch persisted state. Skipped on the first connect,
			// where components have just loaded their own data.
			if (this.hasConnectedBefore) {
				this.reconnectListeners.forEach((listener) => {
					try {
						listener();
					} catch {
						// a bad listener must not break the others
					}
				});
			}
			this.hasConnectedBefore = true;
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

	/**
	 * Fires after the socket is re-established following a drop. Realtime delivery
	 * is best-effort with no replay, so anything that must not miss updates should
	 * refetch from MongoDB here.
	 */
	public onReconnect(listener: () => void): () => void {
		this.reconnectListeners.add(listener);
		return () => {
			this.reconnectListeners.delete(listener);
		};
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
