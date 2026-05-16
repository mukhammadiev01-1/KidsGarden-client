import React from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';

interface EventData {
	eventTitle: string;
	city: string;
	description: string;
	imageSrc: string;
}
const eventsData: EventData[] = [
	{
		eventTitle: 'Open Classroom Day',
		city: 'Incheon',
		description: 'Visit a center and see how children spend a typical learning day.',
		imageSrc: '/img/events/INCHEON.webp',
	},
	{
		eventTitle: 'Parent Orientation',
		city: 'Seoul',
		description: 'Learn about programs, meals, safety routines, and enrollment steps for your child.',
		imageSrc: '/img/events/SEOUL.webp',
	},
	{
		eventTitle: 'Family Art Morning',
		city: 'Daegu',
		description: 'A gentle weekend activity where families explore creative play together.',
		imageSrc: '/img/events/DAEGU.webp',
	},
	{
		eventTitle: 'Outdoor Play Week',
		city: 'Busan',
		description: 'Discover centers with active playgrounds, nature walks, and movement-rich programs.',
		imageSrc: '/img/events/BUSAN.webp',
	},
];

const EventCard = ({ event }: { event: EventData }) => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack
				className="event-card"
				style={{
					backgroundImage: `url(${event?.imageSrc})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				<Box component={'div'} className={'info'}>
					<strong>{event?.city}</strong>
					<span>{event?.eventTitle}</span>
				</Box>
				<Box component={'div'} className={'more'}>
					<span>{event?.description}</span>
				</Box>
			</Stack>
		);
	}
};

const Events = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack className={'events'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span className={'white'}>Family Events</span>
							<p className={'white'}>Meet centers through open days and parent sessions</p>
						</Box>
					</Stack>
					<Stack className={'card-wrapper'}>
						{eventsData.map((event: EventData) => {
							return <EventCard event={event} key={event?.eventTitle} />;
						})}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Events;
