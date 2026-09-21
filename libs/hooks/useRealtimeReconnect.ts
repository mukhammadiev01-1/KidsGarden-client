import { useEffect, useRef } from 'react';
import { realtimeClient } from '../realtime/realtimeClient';

/**
 * Runs `handler` after the realtime socket reconnects following a drop.
 *
 * Realtime delivery is best-effort: the backend publishes to Redis and forgets,
 * so anything emitted while a client was offline is lost. Screens that must not
 * miss updates refetch persisted state here. As with useRealtimeEvent, the
 * handler is held in a ref so the subscription does not churn.
 */
export const useRealtimeReconnect = (handler: () => void, enabled = true) => {
	const handlerRef = useRef(handler);

	useEffect(() => {
		handlerRef.current = handler;
	}, [handler]);

	useEffect(() => {
		if (!enabled) return undefined;

		return realtimeClient.onReconnect(() => handlerRef.current());
	}, [enabled]);
};
