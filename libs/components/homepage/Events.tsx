import React from 'react';
import { Stack, Box } from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import CollectionsRoundedIcon from '@mui/icons-material/CollectionsRounded';
import { useTranslation } from 'next-i18next';

interface EventData {
	eventTitle: string;
	label: string;
	description: string;
	tone: string;
	icon: React.ElementType;
	available?: boolean;
}

const EventCard = ({ event }: { event: EventData }) => {
	const Icon = event.icon;

	return (
		<Stack className={`event-card roadmap-card ${event.tone} ${event.available ? 'available' : 'planned'}`}>
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
	const { t } = useTranslation('common');
	const eventsData: EventData[] = [
		{ eventTitle: t('home.roadmap.privateChatTitle'), label: t('home.available'), description: t('home.roadmap.privateChatCopy'), tone: 'green', icon: ForumRoundedIcon, available: true },
		{ eventTitle: t('home.roadmap.translationTitle'), label: t('home.available'), description: t('home.roadmap.translationCopy'), tone: 'purple', icon: TranslateRoundedIcon, available: true },
		{ eventTitle: t('home.roadmap.callsTitle'), label: t('home.comingSoon'), description: t('home.roadmap.callsCopy'), tone: 'blue', icon: CallRoundedIcon },
		{ eventTitle: t('home.roadmap.reportsTitle'), label: t('home.available'), description: t('home.roadmap.reportsCopy'), tone: 'pink', icon: CollectionsRoundedIcon, available: true },
	];

	return (
		<Stack className={'events communication-roadmap'}>
			<Stack className={'container'}>
				<Stack className={'info-box'}>
					<Box component={'div'} className={'left'}>
						<span>
							{t('home.roadmapTitle')} <em className={'sprout-accent'} aria-hidden />
						</span>
						<p>{t('home.roadmapSubtitle')}</p>
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
