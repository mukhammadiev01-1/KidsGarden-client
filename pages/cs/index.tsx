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
import { useTranslation } from 'next-i18next';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CS: NextPage = () => {
	const { t } = useTranslation('common');

	const supportCategories = [
		{
			title: t('csPage.page.categories.parentsTitle'),
			copy: t('csPage.page.categories.parentsCopy'),
			icon: <FamilyRestroomRoundedIcon />,
		},
		{
			title: t('csPage.page.categories.kindergartensTitle'),
			copy: t('csPage.page.categories.kindergartensCopy'),
			icon: <ApartmentRoundedIcon />,
		},
		{
			title: t('csPage.page.categories.teachersTitle'),
			copy: t('csPage.page.categories.teachersCopy'),
			icon: <SchoolRoundedIcon />,
		},
		{
			title: t('csPage.page.categories.accountTitle'),
			copy: t('csPage.page.categories.accountCopy'),
			icon: <LoginRoundedIcon />,
		},
		{
			title: t('csPage.page.categories.applicationsTitle'),
			copy: t('csPage.page.categories.applicationsCopy'),
			icon: <AssignmentTurnedInRoundedIcon />,
		},
		{
			title: t('csPage.page.categories.safetyTitle'),
			copy: t('csPage.page.categories.safetyCopy'),
			icon: <SecurityRoundedIcon />,
		},
	];

	const faqs = [
		{
			question: t('csPage.page.faqs.findQuestion'),
			answer: t('csPage.page.faqs.findAnswer'),
		},
		{
			question: t('csPage.page.faqs.applicationsQuestion'),
			answer: t('csPage.page.faqs.applicationsAnswer'),
		},
		{
			question: t('csPage.page.faqs.teachersQuestion'),
			answer: t('csPage.page.faqs.teachersAnswer'),
		},
		{
			question: t('csPage.page.faqs.dataQuestion'),
			answer: t('csPage.page.faqs.dataAnswer'),
		},
		{
			question: t('csPage.page.faqs.contactQuestion'),
			answer: t('csPage.page.faqs.contactAnswer'),
		},
	];

	return (
		<div className="cs-page">
			<div className="container">
				<section className="cs-hero">
					<div className="cs-hero-copy">
						<span className="cs-eyebrow">{t('csPage.page.eyebrow')}</span>
						<h1>{t('csPage.page.title')}</h1>
						<p className="cs-hero-subtitle">{t('csPage.page.subtitle')}</p>
						<div className="cs-search-prompt">
							<SearchRoundedIcon />
							<span>{t('csPage.page.searchPrompt')}</span>
						</div>
					</div>
					<div className="cs-hero-card">
						<span>{t('csPage.page.heroCardLabel')}</span>
						<strong>{t('csPage.page.heroCardTitle')}</strong>
						<div className="cs-hero-card-grid">
							<p>{t('csPage.page.heroCardParentDashboard')}</p>
							<p>{t('csPage.page.heroCardCenterTools')}</p>
							<p>{t('csPage.page.heroCardTeacherAccess')}</p>
							<p>{t('csPage.page.heroCardPrivacy')}</p>
						</div>
					</div>
				</section>

				<section className="cs-section">
					<div className="cs-section-heading">
						<span>{t('csPage.page.categoriesEyebrow')}</span>
						<h2>{t('csPage.page.categoriesTitle')}</h2>
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
							<span>{t('admin.menu.faq')}</span>
							<h2>{t('csPage.page.faqTitle')}</h2>
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
						<h2>{t('csPage.page.contactTitle')}</h2>
						<p>{t('csPage.page.contactCopy')}</p>
						<a className="cs-support-button" href="mailto:support@kidsgarden.com">
							{t('csPage.page.emailSupport')}
						</a>
						<span>support@kidsgarden.com</span>
					</aside>
				</section>
			</div>
		</div>
	);
};

export default withLayoutBasic(CS);
