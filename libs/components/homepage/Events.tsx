import React from 'react';
import { Stack, Box } from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import CollectionsRoundedIcon from '@mui/icons-material/CollectionsRounded';

interface EventData {
	eventTitle: string;
	label: string;
	description: string;
	tone: string;
	icon: React.ElementType;
}

const eventsData: EventData[] = [
	{
		eventTitle: 'Private Chat',
		label: 'Coming Soon',
		description: 'One-on-one messages when you need them.',
		tone: 'green',
		icon: ForumRoundedIcon,
	},
	{
		eventTitle: 'Auto Translation',
		label: 'Coming Soon',
		description: 'Break language barriers with instant translation.',
		tone: 'purple',
		icon: TranslateRoundedIcon,
	},
	{
		eventTitle: 'In-app Calls',
		label: 'Coming Soon',
		description: 'Talk directly without leaving the app.',
		tone: 'blue',
		icon: CallRoundedIcon,
	},
	{
		eventTitle: 'Daily Reports & Albums',
		label: 'Coming Soon',
		description: 'Capture and celebrate every special moment.',
		tone: 'pink',
		icon: CollectionsRoundedIcon,
	},
];

const EventCard = ({ event }: { event: EventData }) => {
	const Icon = event.icon;

	return (
		<Stack className={`event-card roadmap-card ${event.tone}`}>
			<strong>{event.label}</strong>
			<span className={'roadmap-icon'}>
				<Icon />
			</span>
			<h3>{event.eventTitle}</h3>
			<p>{event.description}</p>
		</Stack>
	);
};

const Events = () => {
	return (
		<Stack className={'events communication-roadmap'}>
			<Stack className={'container'}>
				<Stack className={'info-box'}>
					<Box component={'div'} className={'left'}>
						<span>
							Communication Roadmap <em className={'sprout-accent'} aria-hidden />
						</span>
						<p>Exciting features coming soon to bring us even closer together.</p>
					</Box>
				</Stack>
				<Stack className={'card-wrapper'}>
					{eventsData.map((event: EventData) => {
						return <EventCard event={event} key={event.eventTitle} />;
					})}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Events;
