import { useEffect } from 'react';
import { realtimeClient } from '../realtime/realtimeClient';

export const useRealtimeEvent = <TPayload = unknown>(
	eventName: string,
	handler: (payload: TPayload) => void,
	enabled = true,
) => {
	useEffect(() => {
		if (!enabled) return undefined;

		return realtimeClient.subscribe<TPayload>(eventName, handler);
	}, [enabled, eventName, handler]);
};
