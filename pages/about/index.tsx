import React, { ElementType } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import PageSeo from '../../libs/components/seo/PageSeo';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const aboutImages = {
	hero: '/img/about/about-hero-classroom.png',
	why: '/img/about/about-teacher-learning.png',
	parent: '/img/about/about-parent-tablet.png',
	teacher: '/img/about/about-teacher-learning.png',
	center: '/img/about/about-kindergarten-building.png',
	safety: '/img/about/about-safety-shield.png',
	final: '/img/about/about-final-family.png',
};

interface IconItem {
	title: string;
	copy?: string;
	icon: ElementType;
	tone?: 'green' | 'gold' | 'blue' | 'purple';
}

interface RoleCard {
	title: string;
	items: string[];
	image: string;
	alt: string;
	tone: 'parent' | 'teacher' | 'admin';
}

const missionCards: IconItem[] = [
	{
		title: 'Parents need clarity',
		copy: 'Clear information, honest details, and confidence in every decision.',
		icon: FamilyRestroomRoundedIcon,
		tone: 'green',
	},
	{
		title: 'Centers need organization',
		copy: 'Manage staff, children, groups, applications, and daily operations.',
		icon: HomeWorkRoundedIcon,
		tone: 'gold',
	},
	{
		title: 'Teachers need simple workflows',
		copy: 'Focus more on children with easy-to-use tools and communication.',
		icon: ChatBubbleRoundedIcon,
		tone: 'purple',
	},
];

const roleCards: RoleCard[] = [
	{
		title: 'Parent',
		items: ['Discover kindergartens', 'Contact and apply', 'Track applications', 'Stay connected'],
		image: aboutImages.parent,
		alt: 'Parent reviewing early learning information at a table',
		tone: 'parent',
	},
	{
		title: 'Teacher',
		items: ['Manage groups', 'Track attendance', 'Daily communication', 'Child insights'],
		image: aboutImages.teacher,
		alt: 'Teacher helping a child with an early learning activity',
		tone: 'teacher',
	},
	{
		title: 'Kindergarten Admin',
		items: ['Staff and access management', 'Groups and classrooms', 'Applications and enrollment', 'Reports and overview'],
		image: aboutImages.center,
		alt: 'Modern kindergarten center exterior and outdoor play area',
		tone: 'admin',
	},
];

const availableFeatures: IconItem[] = [
	{ title: 'Kindergarten listing', icon: SearchRoundedIcon },
	{ title: 'Kindergarten detail pages', icon: HomeWorkRoundedIcon },
	{ title: 'Map & address search', icon: MapRoundedIcon },
	{ title: 'Applications & contact flow', icon: AssignmentTurnedInRoundedIcon },
	{ title: 'Likes, reviews & comments', icon: ChatBubbleRoundedIcon },
	{ title: 'Messages inbox', icon: ChatBubbleRoundedIcon },
	{ title: 'Private chat', icon: GroupsRoundedIcon },
	{ title: 'One-click translation', icon: TranslateRoundedIcon },
	{ title: 'Notifications', icon: NotificationsRoundedIcon },
	{ title: 'Parent dashboard', icon: FamilyRestroomRoundedIcon },
	{ title: 'Teacher dashboard', icon: SchoolRoundedIcon },
	{ title: 'KAdmin dashboard', icon: ManageAccountsRoundedIcon },
	{ title: 'Staff, groups, children, attendance', icon: AdminPanelSettingsRoundedIcon },
	{ title: 'Super Admin approvals', icon: ShieldRoundedIcon },
];

const plannedFeatures: IconItem[] = [
	{ title: 'KidsGarden Store', icon: StorefrontRoundedIcon },
	{ title: 'Daily Reports & Albums', icon: PhotoLibraryRoundedIcon },
	{ title: 'Calendar & scheduling', icon: CalendarMonthRoundedIcon },
	{ title: 'In-app Calls', icon: CallRoundedIcon },
	{ title: 'Mobile polish', icon: PhoneIphoneRoundedIcon },
	{ title: 'More tools coming soon', icon: AdminPanelSettingsRoundedIcon },
];

const trustItems = [
	'Public signup creates a Parent account.',
	'Teacher and Kindergarten Admin access requires approval, request, or invite.',
	'Super Admin is internal only.',
	'Social login does not grant privileged roles.',
	'We are committed to keeping children’s data safe and private.',
];

const About: NextPage = () => {
	return (
		<div className="about-page">
			<PageSeo
				title="About KidsGarden"
				description="KidsGarden brings kindergarten discovery, applications, daily care, attendance, and communication together in one simple place."
				canonicalPath="/about"
			/>

			<section className="about-hero">
				<div className="about-shell about-hero-grid">
					<div className="about-hero-copy">
						<span className="about-badge">
							<CheckCircleRoundedIcon />
							ABOUT KIDSGARDEN
						</span>
						<h1>
							Connecting what <span>matters</span> in early learning
						</h1>
						<p>
							KidsGarden brings kindergarten discovery, applications, daily care, attendance, and
							communication together in one simple place.
						</p>
						<div className="about-actions">
							<Link href="/kindergartens" className="about-action about-action-primary">
								Explore Kindergartens
								<ArrowForwardRoundedIcon />
							</Link>
							<Link href="/store" className="about-action about-action-secondary">
								Visit Store Preview
								<StorefrontRoundedIcon />
							</Link>
						</div>
						<div className="about-hero-note">
							<span className="leaf-mark" aria-hidden="true" />
							Built for families, teachers, and kindergartens who care about children.
						</div>
					</div>

					<div className="about-hero-media">
						<div className="about-photo-frame about-hero-photo">
							<img
								src={aboutImages.hero}
								alt="Teacher and children learning together in a warm kindergarten classroom"
							/>
						</div>
						<div className="about-float-card about-float-parent">
							<span>
								<FamilyRestroomRoundedIcon />
							</span>
							<div>
								<strong>Parent discovery</strong>
								<p>Find the right place for your child</p>
							</div>
						</div>
						<div className="about-float-card about-float-role">
							<span>
								<ShieldRoundedIcon />
							</span>
							<div>
								<strong>Role-based access</strong>
								<p>Secure access for parents, teachers and admins</p>
							</div>
						</div>
						<div className="about-float-card about-float-care">
							<span>
								<CalendarMonthRoundedIcon />
							</span>
							<div>
								<strong>Daily care tools</strong>
								<p>Attendance, groups, communication and more</p>
							</div>
						</div>
						<span className="about-leaf about-leaf-one" aria-hidden="true" />
						<span className="about-leaf about-leaf-two" aria-hidden="true" />
					</div>
				</div>
			</section>

			<section className="about-section about-why">
				<div className="about-shell about-why-panel">
					<div className="about-photo-frame about-why-photo">
						<img src={aboutImages.why} alt="Teacher helping a child with a classroom learning activity" />
					</div>
					<div className="about-why-copy">
						<div className="about-section-heading">
							<span>
								<CheckCircleRoundedIcon />
								WHY KIDSGARDEN EXISTS
							</span>
							<h2>Stronger connections. Better early learning.</h2>
						</div>
						<div className="about-mission-grid">
							{missionCards.map((card) => {
								const Icon = card.icon;

								return (
									<article className={`about-mini-card about-mini-${card.tone}`} key={card.title}>
										<span className="about-icon">
											<Icon />
										</span>
										<h3>{card.title}</h3>
										<p>{card.copy}</p>
									</article>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			<section className="about-section about-roles-section">
				<div className="about-shell">
					<div className="about-section-heading about-heading-center">
						<span>PLATFORM ROLES</span>
						<h2>Different roles, one platform</h2>
					</div>
					<div className="about-role-grid">
						{roleCards.map((role) => (
							<article className={`about-role-card about-role-${role.tone}`} key={role.title}>
								<div className="about-role-content">
									<h3>{role.title}</h3>
									<ul>
										{role.items.map((item) => (
											<li key={item}>
												<CheckCircleRoundedIcon />
												<span>{item}</span>
											</li>
										))}
									</ul>
								</div>
								<img src={role.image} alt={role.alt} />
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="about-section about-feature-section">
				<div className="about-shell about-feature-panels">
					<div className="about-feature-panel about-feature-available">
						<div className="about-feature-title">
							<CheckCircleRoundedIcon />
							<h2>What works today</h2>
						</div>
						<div className="about-feature-grid">
							{availableFeatures.map((feature) => {
								const Icon = feature.icon;

								return (
									<div className="about-feature-item" key={feature.title}>
										<span>
											<Icon />
										</span>
										<strong>{feature.title}</strong>
									</div>
								);
							})}
						</div>
					</div>
					<div className="about-feature-panel about-feature-planned">
						<div className="about-feature-title">
							<CalendarMonthRoundedIcon />
							<h2>What comes next</h2>
						</div>
						<div className="about-feature-grid">
							{plannedFeatures.map((feature) => {
								const Icon = feature.icon;

								return (
									<div className="about-feature-item about-feature-item-planned" key={feature.title}>
										<span>
											<Icon />
										</span>
										<strong>{feature.title}</strong>
										<em>Planned</em>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			<section className="about-section about-trust-section">
				<div className="about-shell about-trust-panel">
					<div className="about-photo-frame about-shield-visual">
						<img src={aboutImages.safety} alt="Green shield and lock illustration representing child data safety" />
					</div>
					<div className="about-trust-copy">
						<h2>Trust & access policy</h2>
						<ul>
							{trustItems.map((item) => (
								<li key={item}>
									<CheckCircleRoundedIcon />
									<span>{item}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</section>

			<section className="about-section about-final-section">
				<div className="about-shell about-final-card">
					<div className="about-final-copy">
						<h2>Explore the KidsGarden experience</h2>
						<p>Browse kindergartens today and preview the tools planned for families, teachers, and centers.</p>
						<div className="about-actions">
							<Link href="/kindergartens" className="about-action about-action-primary">
								Browse Kindergartens
								<ArrowForwardRoundedIcon />
							</Link>
							<Link href="/" className="about-action about-action-secondary">
								Back to Home
								<HomeWorkRoundedIcon />
							</Link>
						</div>
					</div>
					<div className="about-photo-frame about-final-photo">
						<img src={aboutImages.final} alt="Parent and child learning together in a warm KidsGarden setting" />
					</div>
					<span className="about-leaf about-leaf-final" aria-hidden="true" />
				</div>
			</section>

			<style jsx>{`
				.about-page {
					min-height: 100vh;
					background:
						radial-gradient(circle at 8% 10%, rgba(255, 220, 140, 0.2), transparent 28%),
						radial-gradient(circle at 90% 30%, rgba(47, 125, 74, 0.08), transparent 30%),
						#fbf8f0;
					color: #17263a;
				}

				.about-shell {
					width: min(1140px, calc(100% - 48px));
					margin: 0 auto;
				}

				.about-hero {
					padding: 118px 0 36px;
				}

				.about-hero-grid {
					display: grid;
					grid-template-columns: minmax(0, 0.86fr) minmax(520px, 1.14fr);
					gap: 44px;
					align-items: center;
				}

				.about-hero-copy {
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					gap: 20px;
				}

				.about-badge,
				.about-section-heading span {
					width: fit-content;
					display: inline-flex;
					align-items: center;
					gap: 8px;
					padding: 9px 16px;
					border-radius: 999px;
					background: #eef8e9;
					color: #11783f;
					font-size: 13px;
					font-weight: 900;
					letter-spacing: 0.01em;
				}

				.about-badge :global(svg),
				.about-section-heading span :global(svg) {
					width: 16px;
					height: 16px;
				}

				.about-hero h1 {
					margin: 0;
					color: #17263a;
					font-size: 49px;
					font-weight: 950;
					line-height: 1.07;
					letter-spacing: 0;
				}

				.about-hero h1 span {
					color: #138246;
				}

				.about-hero-copy p {
					margin: 0;
					max-width: 510px;
					color: #344256;
					font-size: 17px;
					font-weight: 600;
					line-height: 1.65;
				}

				.about-actions {
					display: flex;
					flex-wrap: wrap;
					gap: 14px;
				}

				:global(.about-action) {
					min-height: 45px;
					padding: 0 24px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					gap: 9px;
					border-radius: 10px;
					font-size: 14px;
					font-weight: 900;
					text-decoration: none;
					transition:
						transform 160ms ease,
						box-shadow 160ms ease,
						background-color 160ms ease,
						border-color 160ms ease;
				}

				:global(.about-action:hover) {
					transform: translateY(-1px);
				}

				:global(.about-action svg) {
					width: 18px;
					height: 18px;
				}

				:global(.about-action-primary) {
					background: #118247;
					color: #ffffff;
					box-shadow: 0 12px 24px rgba(17, 130, 71, 0.2);
				}

				:global(.about-action-primary:hover) {
					background: #0e703e;
				}

				:global(.about-action-secondary) {
					border: 1px solid #d9e4d4;
					background: rgba(255, 255, 255, 0.88);
					color: #26394a;
					box-shadow: 0 10px 22px rgba(37, 65, 49, 0.08);
				}

				:global(.about-action-secondary:hover) {
					border-color: #a9cfa5;
					background: #ffffff;
				}

				.about-hero-note {
					width: min(100%, 430px);
					min-height: 74px;
					padding: 16px 18px;
					display: grid;
					grid-template-columns: 34px 1fr;
					align-items: center;
					gap: 16px;
					border: 1px solid #dfe9d8;
					border-radius: 15px;
					background: rgba(247, 251, 243, 0.86);
					box-shadow: 0 14px 34px rgba(42, 79, 48, 0.08);
					color: #203443;
					font-size: 16px;
					font-weight: 750;
					line-height: 1.45;
				}

				.leaf-mark {
					position: relative;
					width: 30px;
					height: 30px;
					display: inline-block;
				}

				.leaf-mark::before,
				.leaf-mark::after {
					content: '';
					position: absolute;
					border-radius: 18px 18px 18px 4px;
					background: #2f9f5a;
					transform: rotate(45deg);
				}

				.leaf-mark::before {
					width: 13px;
					height: 18px;
					left: 4px;
					top: 7px;
				}

				.leaf-mark::after {
					width: 11px;
					height: 15px;
					right: 5px;
					top: 4px;
					background: #f0bb3d;
				}

				.about-hero-media,
				.about-final-card {
					position: relative;
				}

				.about-photo-frame {
					position: relative;
					overflow: hidden;
					background: #eef8e9;
				}

				.about-photo-frame img {
					width: 100%;
					height: 100%;
					display: block;
					object-fit: cover;
				}

				.about-hero-photo {
					height: 410px;
					border-radius: 28px;
					box-shadow: 0 24px 56px rgba(36, 65, 49, 0.13);
				}

				.about-hero-photo::after,
				.about-final-photo::after {
					content: '';
					position: absolute;
					inset: 0;
					background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 250, 240, 0.14));
					pointer-events: none;
				}

				.about-float-card {
					position: absolute;
					z-index: 2;
					width: 205px;
					padding: 16px;
					display: grid;
					grid-template-columns: 44px 1fr;
					gap: 13px;
					align-items: flex-start;
					border: 1px solid rgba(222, 232, 216, 0.88);
					border-radius: 15px;
					background: rgba(255, 255, 255, 0.94);
					box-shadow: 0 16px 34px rgba(31, 55, 41, 0.13);
					backdrop-filter: blur(6px);
				}

				.about-float-card span {
					width: 42px;
					height: 42px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border-radius: 14px;
					background: #eaf7e5;
					color: #138246;
				}

				.about-float-card :global(svg) {
					width: 24px;
					height: 24px;
				}

				.about-float-card strong {
					display: block;
					margin-bottom: 6px;
					color: #1f2e41;
					font-size: 13px;
					font-weight: 950;
				}

				.about-float-card p {
					margin: 0;
					color: #425167;
					font-size: 12px;
					font-weight: 700;
					line-height: 1.55;
				}

				.about-float-parent {
					top: 42px;
					right: -22px;
				}

				.about-float-role {
					top: 168px;
					right: -38px;
				}

				.about-float-care {
					left: 18px;
					bottom: 22px;
					width: 240px;
				}

				.about-leaf {
					position: absolute;
					z-index: 1;
					width: 54px;
					height: 120px;
					pointer-events: none;
				}

				.about-leaf::before,
				.about-leaf::after {
					content: '';
					position: absolute;
					border-radius: 34px 34px 34px 3px;
					background: rgba(135, 191, 93, 0.34);
					transform: rotate(38deg);
				}

				.about-leaf::before {
					width: 31px;
					height: 74px;
					left: 7px;
					top: 0;
				}

				.about-leaf::after {
					width: 25px;
					height: 58px;
					right: 1px;
					bottom: 0;
					background: rgba(47, 125, 74, 0.22);
				}

				.about-leaf-one {
					right: -28px;
					bottom: 8px;
					transform: rotate(28deg);
				}

				.about-leaf-two {
					right: 26px;
					bottom: -10px;
					transform: rotate(52deg) scale(0.7);
				}

				.about-section {
					padding: 34px 0;
				}

				.about-why-panel {
					padding: 24px;
					display: grid;
					grid-template-columns: 420px minmax(0, 1fr);
					gap: 42px;
					align-items: center;
					border-radius: 28px;
					background: rgba(255, 255, 255, 0.62);
					box-shadow: 0 18px 50px rgba(39, 70, 48, 0.08);
				}

				.about-why-photo {
					height: 330px;
					border-radius: 24px;
					box-shadow: 0 16px 32px rgba(38, 70, 50, 0.1);
				}

				.about-section-heading {
					margin-bottom: 22px;
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.about-section-heading h2,
				.about-feature-title h2,
				.about-trust-copy h2,
				.about-final-copy h2 {
					margin: 0;
					color: #1d2c42;
					font-size: 34px;
					font-weight: 950;
					line-height: 1.13;
					letter-spacing: 0;
				}

				.about-mission-grid {
					display: grid;
					grid-template-columns: repeat(3, minmax(0, 1fr));
					gap: 18px;
				}

				.about-mini-card {
					min-height: 170px;
					padding: 22px 19px;
					border: 1px solid #e3e8de;
					border-radius: 18px;
					background: #ffffff;
					box-shadow: 0 12px 30px rgba(45, 68, 52, 0.07);
				}

				.about-icon {
					width: 48px;
					height: 48px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border-radius: 16px;
					background: #eaf7e5;
					color: #14834a;
				}

				.about-mini-gold .about-icon {
					background: #fff3dd;
					color: #de8d13;
				}

				.about-mini-purple .about-icon {
					background: #f1ecff;
					color: #8062c6;
				}

				.about-icon :global(svg) {
					width: 27px;
					height: 27px;
				}

				.about-mini-card h3 {
					margin: 18px 0 8px;
					color: #203145;
					font-size: 17px;
					font-weight: 950;
					line-height: 1.28;
				}

				.about-mini-card p {
					margin: 0;
					color: #405168;
					font-size: 14px;
					font-weight: 650;
					line-height: 1.58;
				}

				.about-heading-center {
					align-items: center;
					text-align: center;
				}

				.about-role-grid {
					display: grid;
					grid-template-columns: repeat(3, minmax(0, 1fr));
					gap: 18px;
				}

				.about-role-card {
					position: relative;
					min-height: 200px;
					padding: 22px;
					display: grid;
					grid-template-columns: minmax(0, 0.92fr) minmax(120px, 0.82fr);
					gap: 10px;
					border: 1px solid #dfe8d8;
					border-radius: 18px;
					background: linear-gradient(135deg, #f3fbef 0%, #ffffff 100%);
					box-shadow: 0 16px 34px rgba(37, 65, 47, 0.08);
					overflow: hidden;
				}

				.about-role-teacher {
					background: linear-gradient(135deg, #fff7e8 0%, #ffffff 100%);
				}

				.about-role-admin {
					background: linear-gradient(135deg, #f3f0ff 0%, #ffffff 100%);
				}

				.about-role-card h3 {
					margin: 0 0 13px;
					color: #1c2d42;
					font-size: 19px;
					font-weight: 950;
				}

				.about-role-card ul,
				.about-trust-copy ul {
					margin: 0;
					padding: 0;
					display: grid;
					gap: 10px;
					list-style: none;
				}

				.about-role-card li,
				.about-trust-copy li {
					display: flex;
					align-items: flex-start;
					gap: 8px;
					color: #2f4156;
					font-size: 13px;
					font-weight: 760;
					line-height: 1.35;
				}

				.about-role-card li :global(svg),
				.about-trust-copy li :global(svg) {
					flex: 0 0 auto;
					width: 16px;
					height: 16px;
					color: #14834a;
				}

				.about-role-teacher li :global(svg) {
					color: #df9015;
				}

				.about-role-admin li :global(svg) {
					color: #6f62c7;
				}

				.about-role-card img {
					position: absolute;
					right: 0;
					bottom: 0;
					width: 48%;
					height: 75%;
					object-fit: cover;
					object-position: center;
					border-radius: 22px 0 17px 0;
					-webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 18%);
					mask-image: linear-gradient(90deg, transparent 0%, #000 18%);
				}

				.about-role-content {
					position: relative;
					z-index: 1;
				}

				.about-feature-section {
					padding-top: 22px;
				}

				.about-feature-panels {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 18px;
				}

				.about-feature-panel {
					padding: 28px;
					border: 1px solid #e4eadf;
					border-radius: 22px;
					background: rgba(255, 255, 255, 0.72);
					box-shadow: 0 18px 44px rgba(45, 73, 52, 0.08);
				}

				.about-feature-planned {
					background:
						radial-gradient(circle at 92% 10%, rgba(255, 196, 73, 0.16), transparent 30%),
						rgba(255, 252, 245, 0.78);
				}

				.about-feature-title {
					margin-bottom: 20px;
					display: flex;
					align-items: center;
					gap: 12px;
				}

				.about-feature-title > :global(svg) {
					width: 27px;
					height: 27px;
					color: #14834a;
				}

				.about-feature-planned .about-feature-title > :global(svg) {
					color: #d98210;
				}

				.about-feature-title h2 {
					font-size: 23px;
				}

				.about-feature-grid {
					display: grid;
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 16px 18px;
				}

				.about-feature-item {
					min-width: 0;
					display: grid;
					grid-template-columns: 38px 1fr;
					align-items: center;
					gap: 10px;
				}

				.about-feature-item span {
					width: 36px;
					height: 36px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border: 1px solid #e2eadf;
					border-radius: 10px;
					background: #ffffff;
					color: #14834a;
					box-shadow: 0 8px 18px rgba(35, 58, 43, 0.06);
				}

				.about-feature-item-planned span {
					color: #ca7e12;
				}

				.about-feature-item :global(svg) {
					width: 20px;
					height: 20px;
				}

				.about-feature-item strong {
					color: #26384e;
					font-size: 12px;
					font-weight: 850;
					line-height: 1.25;
				}

				.about-feature-item em {
					grid-column: 2;
					width: fit-content;
					margin-top: -2px;
					padding: 3px 7px;
					border-radius: 999px;
					background: #fff3dc;
					color: #c1750d;
					font-size: 10px;
					font-style: normal;
					font-weight: 900;
					line-height: 1;
				}

				.about-trust-panel {
					padding: 24px;
					display: grid;
					grid-template-columns: 300px minmax(0, 1fr);
					gap: 28px;
					align-items: center;
					border-radius: 24px;
					background:
						radial-gradient(circle at 14% 18%, rgba(188, 227, 178, 0.25), transparent 28%),
						radial-gradient(circle at 88% 70%, rgba(255, 207, 97, 0.14), transparent 25%),
						#fffdf7;
				}

				.about-shield-visual {
					min-height: 205px;
					height: 205px;
					border-radius: 22px;
					background:
						radial-gradient(circle at 18% 18%, rgba(188, 227, 178, 0.42), transparent 20%),
						linear-gradient(135deg, #eff9e9 0%, #fff7e5 100%);
					box-shadow: 0 14px 32px rgba(42, 79, 48, 0.08);
				}

				.about-shield-visual img {
					padding: 18px;
					object-fit: contain;
					box-sizing: border-box;
				}

				.about-trust-copy h2 {
					margin-bottom: 18px;
					font-size: 29px;
				}

				.about-trust-copy li {
					font-size: 14px;
					font-weight: 760;
				}

				.about-final-section {
					padding-bottom: 70px;
				}

				.about-final-card {
					padding: 30px 34px;
					display: grid;
					grid-template-columns: minmax(0, 0.95fr) minmax(380px, 1fr);
					gap: 28px;
					align-items: center;
					border: 1px solid #e0ead9;
					border-radius: 24px;
					background:
						radial-gradient(circle at 90% 24%, rgba(47, 125, 74, 0.12), transparent 24%),
						linear-gradient(135deg, #f7fbf2 0%, #fff5df 100%);
					box-shadow: 0 20px 48px rgba(45, 73, 52, 0.1);
					overflow: hidden;
				}

				.about-final-copy {
					position: relative;
					z-index: 2;
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					gap: 16px;
				}

				.about-final-copy p {
					max-width: 455px;
					margin: 0;
					color: #455468;
					font-size: 16px;
					font-weight: 650;
					line-height: 1.58;
				}

				.about-final-photo {
					height: 190px;
					border-radius: 24px;
				}

				.about-leaf-final {
					right: 22px;
					bottom: 4px;
					transform: rotate(42deg) scale(0.84);
				}

				@media (max-width: 1100px) {
					.about-hero-grid,
					.about-why-panel,
					.about-feature-panels,
					.about-trust-panel,
					.about-final-card {
						grid-template-columns: 1fr;
					}

					.about-hero-media {
						max-width: 680px;
					}

					.about-float-parent,
					.about-float-role {
						right: 18px;
					}

					.about-why-photo,
					.about-final-photo {
						width: 100%;
					}

					.about-mission-grid,
					.about-role-grid {
						grid-template-columns: 1fr;
					}

					.about-role-card {
						min-height: 220px;
					}
				}

				@media (max-width: 768px) {
					.about-shell {
						width: min(100% - 32px, 560px);
					}

					.about-hero {
						padding: 104px 0 28px;
					}

					.about-hero-grid {
						gap: 30px;
					}

					.about-hero h1 {
						font-size: 42px;
					}

					.about-hero-copy p {
						font-size: 16px;
					}

					.about-actions {
						width: 100%;
						flex-direction: column;
					}

					:global(.about-action) {
						width: 100%;
						box-sizing: border-box;
					}

					.about-hero-note {
						grid-template-columns: 28px 1fr;
						font-size: 14px;
					}

					.about-hero-photo {
						height: 285px;
						border-radius: 24px;
					}

					.about-float-card {
						position: relative;
						top: auto;
						right: auto;
						left: auto;
						bottom: auto;
						width: auto;
						margin-top: 12px;
					}

					.about-leaf {
						display: none;
					}

					.about-section {
						padding: 26px 0;
					}

					.about-why-panel,
					.about-feature-panel,
					.about-trust-panel,
					.about-final-card {
						padding: 20px;
						border-radius: 22px;
					}

					.about-why-photo {
						height: 245px;
					}

					.about-section-heading h2,
					.about-trust-copy h2,
					.about-final-copy h2 {
						font-size: 28px;
					}

					.about-mission-grid,
					.about-feature-grid {
						grid-template-columns: 1fr;
					}

					.about-role-card {
						grid-template-columns: 1fr;
						min-height: 340px;
						padding: 20px;
					}

					.about-role-card img {
						width: 100%;
						height: 180px;
						opacity: 0.86;
						border-radius: 18px;
						-webkit-mask-image: none;
						mask-image: none;
					}

					.about-shield-visual {
						min-height: 180px;
					}

					.about-final-photo {
						height: 210px;
					}
				}
			`}</style>
		</div>
	);
};

export default withLayoutBasic(About);
