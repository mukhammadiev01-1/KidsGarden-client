import React from 'react';
import { NextPage } from 'next';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const supportCategories = [
	{
		title: 'For Parents',
		copy: 'Find centers, manage applications, and follow your child dashboard.',
		icon: <FamilyRestroomRoundedIcon />,
	},
	{
		title: 'For Kindergartens',
		copy: 'Get help with center profiles, staff, groups, children, and approvals.',
		icon: <ApartmentRoundedIcon />,
	},
	{
		title: 'For Teachers',
		copy: 'Understand assigned groups, attendance tools, and classroom workflows.',
		icon: <SchoolRoundedIcon />,
	},
	{
		title: 'Account & Login',
		copy: 'Fix sign-in issues, password questions, and role-based dashboard access.',
		icon: <LoginRoundedIcon />,
	},
	{
		title: 'Applications & Enrollment',
		copy: 'Learn how applications, approvals, and enrollment steps work.',
		icon: <AssignmentTurnedInRoundedIcon />,
	},
	{
		title: 'Safety & Privacy',
		copy: 'See how KidsGarden keeps parent, child, and center information protected.',
		icon: <SecurityRoundedIcon />,
	},
];

const faqs = [
	{
		question: 'How do I find a kindergarten?',
		answer: 'Open Kindergartens, search by location or program, and compare center details before choosing one.',
	},
	{
		question: 'How do applications work?',
		answer: 'Parents can apply through KidsGarden. Centers and administrators review requests through private dashboards.',
	},
	{
		question: 'Can teachers create accounts?',
		answer: 'Public signup creates a parent account first. Teacher access requires an approved staff flow.',
	},
	{
		question: 'How is parent/child data protected?',
		answer: 'Private dashboards are role-based, and public pages do not expose child, parent, teacher, or staff directories.',
	},
	{
		question: 'How do I contact support?',
		answer: 'Use the support email below with your account nickname, center name, and a short description of the issue.',
	},
];

const CS: NextPage = () => {
	return (
		<div className="cs-page">
			<div className="container">
				<section className="cs-hero">
					<div className="cs-hero-copy">
						<span className="cs-eyebrow">KidsGarden Help Center</span>
						<h1>How can we help?</h1>
						<p className="cs-hero-subtitle">
							Support for parents, teachers, and kindergartens using KidsGarden to find centers, manage
							applications, and keep learning spaces organized.
						</p>
						<div className="cs-search-prompt">
							<SearchRoundedIcon />
							<span>Search help topics, applications, accounts, privacy, or community guidance.</span>
						</div>
					</div>
					<div className="cs-hero-card">
						<span>Common starting points</span>
						<strong>Applications, accounts, attendance, and safe community support.</strong>
						<div className="cs-hero-card-grid">
							<p>Parent dashboard</p>
							<p>Center tools</p>
							<p>Teacher access</p>
							<p>Privacy</p>
						</div>
					</div>
				</section>

				<section className="cs-section">
					<div className="cs-section-heading">
						<span>Support categories</span>
						<h2>Choose the area you need</h2>
					</div>
					<div className="cs-category-grid">
						{supportCategories.map((category) => (
							<article className="cs-category-card" key={category.title}>
								<div className="cs-category-icon">{category.icon}</div>
								<strong>{category.title}</strong>
								<p>{category.copy}</p>
							</article>
						))}
					</div>
				</section>

				<section className="cs-faq-layout">
					<div className="cs-faq-panel">
						<div className="cs-section-heading align-left">
							<span>FAQ</span>
							<h2>Quick answers</h2>
						</div>
						<div className="cs-faq-list">
							{faqs.map((faq) => (
								<details className="cs-faq-item" key={faq.question}>
									<summary>
										<span>{faq.question}</span>
										<ArrowForwardRoundedIcon />
									</summary>
									<p>{faq.answer}</p>
								</details>
							))}
						</div>
					</div>

					<aside className="cs-contact-card">
						<div className="cs-contact-icon">
							<EmailRoundedIcon />
						</div>
						<h2>Still need help?</h2>
						<p>
							Send us a short message and the KidsGarden support team will help you find the right next step.
						</p>
						<a className="cs-support-button" href="mailto:support@kidsgarden.com">
							Email support
						</a>
						<span>support@kidsgarden.com</span>
					</aside>
				</section>
			</div>
		</div>
	);
};

export default withLayoutBasic(CS);
