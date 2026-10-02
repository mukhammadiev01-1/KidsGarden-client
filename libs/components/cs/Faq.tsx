import React, { SyntheticEvent, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, Box, Stack, Typography } from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { styled } from '@mui/material/styles';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useTranslation } from 'next-i18next';

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
	const { t } = useTranslation('common');
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

	const categories = [
		{ id: 'families', label: t('csPage.Faq.categoryFamilies') },
		{ id: 'parents', label: t('home.roles.parentsTitle') },
		{ id: 'accounts', label: t('csPage.Faq.categoryAccounts') },
		{ id: 'community', label: t('Community') },
	];

	const data: any = {
		families: [
			{
				id: 'families-1',
				subject: t('csPage.Faq.families.findSubject'),
				content: t('csPage.Faq.families.findContent'),
			},
			{
				id: 'families-2',
				subject: t('csPage.Faq.families.saveSubject'),
				content: t('csPage.Faq.families.saveContent'),
			},
			{
				id: 'families-3',
				subject: t('csPage.Faq.families.askSubject'),
				content: t('csPage.Faq.families.askContent'),
			},
		],
		parents: [
			{
				id: 'parents-1',
				subject: t('csPage.Faq.parents.applyTeacherSubject'),
				content: t('csPage.Faq.parents.applyTeacherContent'),
			},
			{
				id: 'parents-2',
				subject: t('csPage.Faq.parents.applyAdminSubject'),
				content: t('csPage.Faq.parents.applyAdminContent'),
			},
			{
				id: 'parents-3',
				subject: t('csPage.Faq.parents.attendanceSubject'),
				content: t('csPage.Faq.parents.attendanceContent'),
			},
		],
		accounts: [
			{
				id: 'accounts-1',
				subject: t('csPage.Faq.accounts.reloginSubject'),
				content: t('csPage.Faq.accounts.reloginContent'),
			},
			{
				id: 'accounts-2',
				subject: t('csPage.Faq.accounts.accountTypeSubject'),
				content: t('csPage.Faq.accounts.accountTypeContent'),
			},
			{
				id: 'accounts-3',
				subject: t('csPage.Faq.accounts.updateProfileSubject'),
				content: t('csPage.Faq.accounts.updateProfileContent'),
			},
		],
		community: [
			{
				id: 'community-1',
				subject: t('csPage.Faq.community.postSubject'),
				content: t('csPage.Faq.community.postContent'),
			},
			{
				id: 'community-2',
				subject: t('csPage.Faq.community.avoidSubject'),
				content: t('csPage.Faq.community.avoidContent'),
			},
			{
				id: 'community-3',
				subject: t('csPage.Faq.community.reportSubject'),
				content: t('csPage.Faq.community.reportContent'),
			},
		],
	};

	return (
		<Stack className={'faq-content'}>
			<Box className={'categories'} component={'div'}>
				{categories.map((item) => (
					<div
						key={item.id}
						className={category === item.id ? 'active' : ''}
						onClick={() => {
							changeCategoryHandler(item.id);
						}}
					>
						{item.label}
					</div>
				))}
			</Box>
			<Box className={'wrap'} component={'div'}>
				{data[category] &&
					data[category].map((ele: any) => (
						<Accordion expanded={expanded === ele?.id} onChange={handleChange(ele?.id)} key={ele?.id}>
							<AccordionSummary id="panel1d-header" className="question" aria-controls="panel1d-content">
								<Typography className="badge" variant={'h4'}>
									{t('csPage.Faq.questionBadge')}
								</Typography>
								<Typography> {ele?.subject}</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Stack className={'answer flex-box'}>
									<Typography className="badge" variant={'h4'} color={'primary'}>
										{t('csPage.Faq.answerBadge')}
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
