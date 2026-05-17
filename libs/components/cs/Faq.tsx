import React, { SyntheticEvent, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, Box, Stack, Typography } from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { styled } from '@mui/material/styles';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
	({ theme }) => ({
		border: `1px solid ${theme.palette.divider}`,
		'&:not(:last-child)': {
			borderBottom: 0,
		},
		'&:before': {
			display: 'none',
		},
	}),
);
const AccordionSummary = styled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary expandIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: '1.4rem' }} />} {...props} />
))(({ theme }) => ({
	backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : '#fff',
	'& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
		transform: 'rotate(180deg)',
	},
	'& .MuiAccordionSummary-content': {
		marginLeft: theme.spacing(1),
	},
}));

const Faq = () => {
	const [category, setCategory] = useState<string>('families');
	const [expanded, setExpanded] = useState<string | false>('families-1');

	/** HANDLERS **/
	const changeCategoryHandler = (category: string) => {
		setCategory(category);
		setExpanded(`${category}-1`);
	};

	const handleChange = (panel: string) => (event: SyntheticEvent, newExpanded: boolean) => {
		setExpanded(newExpanded ? panel : false);
	};

	const data: any = {
		families: [
			{
				id: 'families-1',
				subject: 'How do I find a kindergarten?',
				content: 'Use the kindergarten search page to browse by location, center type, programs, age range, and capacity.',
			},
			{
				id: 'families-2',
				subject: 'How do I save favorite kindergartens?',
				content: 'Sign in with a parent account and use the heart icon to save kindergartens for later.',
			},
			{
				id: 'families-3',
				subject: 'Where can I ask general parent questions?',
				content: 'Use the Parent Board in the Community section to share questions and experiences with other families.',
			},
		],
		parents: [
			{
				id: 'parents-1',
				subject: 'How can I apply as a teacher?',
				content: 'Open a kindergarten profile and use the teacher application form if applications are available for that kindergarten.',
			},
			{
				id: 'parents-2',
				subject: 'How can I apply to manage a kindergarten?',
				content: 'Parent accounts can submit a kindergarten admin application from My Page for Super Admin review.',
			},
			{
				id: 'parents-3',
				subject: 'Can I see my child attendance?',
				content: 'Parents can view attendance for their own children after the kindergarten links the child record to the parent account.',
			},
		],
		accounts: [
			{
				id: 'accounts-1',
				subject: 'Why do I need to log in again after approval?',
				content: 'Your role is stored in your login token. After approval, signing in again gives you a fresh token with the updated role.',
			},
			{
				id: 'accounts-2',
				subject: 'What account type do I get when I sign up?',
				content: 'Public signup creates a parent account. Additional roles require an application or approval flow.',
			},
			{
				id: 'accounts-3',
				subject: 'Can I update my profile information?',
				content: 'Yes. Sign in and open My Page to update your profile details.',
			},
		],
		community: [
			{
				id: 'community-1',
				subject: 'What can I post in Community?',
				content: 'Families can share kindergarten questions, helpful updates, and parent experiences.',
			},
			{
				id: 'community-2',
				subject: 'What should I avoid posting?',
				content: 'Avoid personal data, private child information, spam, and anything unrelated to family or kindergarten topics.',
			},
			{
				id: 'community-3',
				subject: 'How do I report inappropriate content?',
				content: 'Contact support through the Help Center if you notice content that should be reviewed.',
			},
		],
	};

	return (
		<Stack className={'faq-content'}>
			<Box className={'categories'} component={'div'}>
				<div
					className={category === 'families' ? 'active' : ''}
					onClick={() => {
						changeCategoryHandler('families');
					}}
				>
					Families
				</div>
				<div
					className={category === 'parents' ? 'active' : ''}
					onClick={() => {
						changeCategoryHandler('parents');
					}}
				>
					Parents
				</div>
				<div
					className={category === 'accounts' ? 'active' : ''}
					onClick={() => {
						changeCategoryHandler('accounts');
					}}
				>
					Accounts
				</div>
				<div
					className={category === 'community' ? 'active' : ''}
					onClick={() => {
						changeCategoryHandler('community');
					}}
				>
					Community
				</div>
			</Box>
			<Box className={'wrap'} component={'div'}>
				{data[category] &&
					data[category].map((ele: any) => (
						<Accordion expanded={expanded === ele?.id} onChange={handleChange(ele?.id)} key={ele?.subject}>
							<AccordionSummary id="panel1d-header" className="question" aria-controls="panel1d-content">
								<Typography className="badge" variant={'h4'}>
									Q
								</Typography>
								<Typography> {ele?.subject}</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Stack className={'answer flex-box'}>
									<Typography className="badge" variant={'h4'} color={'primary'}>
										A
									</Typography>
									<Typography> {ele?.content}</Typography>
								</Stack>
							</AccordionDetails>
						</Accordion>
					))}
			</Box>
		</Stack>
	);
};

export default Faq;
