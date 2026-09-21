import { useEffect, useRef } from 'react';
import { realtimeClient } from '../realtime/realtimeClient';

/**
 * Subscribes to a realtime event for the lifetime of the component.
 *
 * `handler` is intentionally NOT a dependency of the subscription effect. Callers
 * memoize it with useCallback, but its identity still changes whenever their own
 * deps change (e.g. the selected conversation). Re-subscribing on every such change
 * tears the subscription down and back up, and realtimeClient closes the socket
 * entirely once the last handler unsubscribes — so switching conversations used to
 * drop and re-authenticate the WebSocket. Holding the handler in a ref keeps the
 * subscription stable while still invoking the latest closure.
 */
export const useRealtimeEvent = <TPayload = unknown>(
	eventName: string,
	handler: (payload: TPayload) => void,
	enabled = true,
) => {
	const handlerRef = useRef(handler);

	useEffect(() => {
		handlerRef.current = handler;
	}, [handler]);

	useEffect(() => {
		if (!enabled) return undefined;

		return realtimeClient.subscribe<TPayload>(eventName, (payload) => handlerRef.current(payload));
	}, [enabled, eventName]);
};
