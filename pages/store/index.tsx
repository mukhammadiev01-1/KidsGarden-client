import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import FamilyRestroomRoundedIcon from '@mui/icons-material/FamilyRestroomRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import PageSeo from '../../libs/components/seo/PageSeo';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const storePreviewCards = [
	{
		title: 'Learning materials',
		copy: 'Storybooks, activity kits, and hands-on learning tools.',
		icon: MenuBookRoundedIcon,
	},
	{
		title: 'Classroom supplies',
		copy: 'Daily essentials for organized, joyful classrooms.',
		icon: SchoolRoundedIcon,
	},
	{
		title: 'Parent essentials',
		copy: 'Helpful items for smoother kindergarten routines.',
		icon: FamilyRestroomRoundedIcon,
	},
];

const StoreComingSoon: NextPage = () => {
	return (
		<div className="store-coming-soon-page">
			<PageSeo
				title="KidsGarden Store"
				description="Educational supplies, classroom tools, and parent essentials will be available in the KidsGarden Store in a future version."
				canonicalPath="/store"
			/>
			<div className="store-page-shell">
				<section className="store-hero-card">
					<div className="store-hero-copy">
						<span className="store-status-badge">
							<StorefrontRoundedIcon />
							Coming Soon
						</span>
						<h1>KidsGarden Store</h1>
						<p>
							Educational supplies, classroom tools, and parent essentials will be available here in a future
							version.
						</p>
						<div className="store-actions">
							<Link href="/" className="store-action store-action-primary">
								<ArrowBackRoundedIcon />
								Back to Home
							</Link>
							<Link href="/kindergartens" className="store-action store-action-secondary">
								<SearchRoundedIcon />
								Browse Kindergartens
							</Link>
						</div>
					</div>
					<div className="store-hero-orb" aria-hidden="true" />
				</section>

				<section className="store-preview-grid" aria-label="Future store categories">
					{storePreviewCards.map((card) => {
						const Icon = card.icon;

						return (
							<article className="store-preview-card" key={card.title}>
								<span className="store-preview-icon">
									<Icon />
								</span>
								<h2>{card.title}</h2>
								<p>{card.copy}</p>
							</article>
						);
					})}
				</section>
			</div>

			<style jsx>{`
				.store-coming-soon-page {
					min-height: calc(100vh - 120px);
					padding: 128px 24px 84px;
					box-sizing: border-box;
					background:
						radial-gradient(circle at 12% 18%, rgba(255, 206, 87, 0.2), transparent 26%),
						radial-gradient(circle at 88% 14%, rgba(83, 160, 95, 0.14), transparent 24%),
						linear-gradient(180deg, #fffaf1 0%, #f5f9ef 100%);
				}

				.store-page-shell {
					width: 100%;
					max-width: 1180px;
					margin: 0 auto;
					display: flex;
					flex-direction: column;
					gap: 32px;
				}

				.store-hero-card {
					position: relative;
					overflow: hidden;
					padding: 52px 56px;
					display: flex;
					border: 1px solid #e2ecd8;
					border-radius: 28px;
					background:
						radial-gradient(circle at 85% 20%, rgba(255, 198, 73, 0.18), transparent 28%),
						#fffdf8;
					box-shadow: 0 24px 60px rgba(47, 85, 54, 0.11);
				}

				.store-hero-copy {
					position: relative;
					z-index: 1;
					width: 68%;
					display: flex;
					flex-direction: column;
					gap: 16px;
				}

				.store-status-badge {
					width: fit-content;
					padding: 8px 13px;
					display: inline-flex;
					align-items: center;
					gap: 8px;
					border-radius: 999px;
					background: #eef8e9;
					color: #2f7d4a;
					font-size: 13px;
					font-weight: 800;
				}

				.store-status-badge :global(svg) {
					width: 18px;
					height: 18px;
				}

				.store-hero-copy h1 {
					margin: 0;
					color: #24332d;
					font-size: 58px;
					font-weight: 900;
					line-height: 1.05;
					letter-spacing: 0;
				}

				.store-hero-copy p {
					max-width: 680px;
					margin: 0;
					color: #52625a;
					font-size: 18px;
					font-weight: 600;
					line-height: 1.65;
				}

				.store-actions {
					padding-top: 4px;
					display: flex;
					flex-wrap: wrap;
					gap: 12px;
				}

				.store-action {
					height: 44px;
					padding: 0 22px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					border-radius: 999px;
					font-size: 14px;
					font-weight: 900;
					line-height: 1;
					text-decoration: none;
					transition:
						background-color 160ms ease,
						border-color 160ms ease,
						transform 160ms ease,
						box-shadow 160ms ease;
				}

				.store-action:hover {
					transform: translateY(-1px);
				}

				.store-action :global(svg) {
					width: 19px;
					height: 19px;
				}

				.store-action-primary {
					background: #2f7d4a;
					color: #ffffff;
					box-shadow: 0 10px 20px rgba(47, 125, 74, 0.16);
				}

				.store-action-primary:hover {
					background: #25683d;
				}

				.store-action-secondary {
					border: 1px solid #cfe0c8;
					background: #ffffff;
					color: #405346;
				}

				.store-action-secondary:hover {
					border-color: #9fc798;
					background: #f3f8ef;
				}

				.store-hero-orb {
					position: absolute;
					right: 52px;
					bottom: 42px;
					width: 230px;
					height: 230px;
					border-radius: 50%;
					background:
						radial-gradient(circle at 42% 38%, #fff5cf 0%, #f8d56a 36%, #69b874 72%, #2f7d4a 100%);
					box-shadow: 0 24px 48px rgba(47, 125, 74, 0.18);
					opacity: 0.9;
				}

				.store-preview-grid {
					display: grid;
					grid-template-columns: repeat(3, minmax(0, 1fr));
					gap: 16px;
				}

				.store-preview-card {
					min-width: 0;
					padding: 24px;
					display: flex;
					flex-direction: column;
					gap: 10px;
					border: 1px solid #e5eddc;
					border-radius: 20px;
					background: #ffffff;
					box-shadow: 0 16px 34px rgba(47, 85, 54, 0.08);
				}

				.store-preview-icon {
					width: 46px;
					height: 46px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border-radius: 15px;
					background: #eef8e9;
					color: #2f7d4a;
				}

				.store-preview-card h2 {
					margin: 0;
					color: #24332d;
					font-size: 18px;
					font-weight: 900;
					line-height: 1.25;
				}

				.store-preview-card p {
					margin: 0;
					color: #637168;
					font-size: 14px;
					line-height: 1.55;
				}

				@media (max-width: 768px) {
					.store-coming-soon-page {
						padding: 104px 18px 56px;
					}

					.store-page-shell {
						gap: 24px;
					}

					.store-hero-card {
						padding: 30px 22px;
						flex-direction: column;
						gap: 26px;
						border-radius: 22px;
					}

					.store-hero-copy {
						width: 100%;
					}

					.store-hero-copy h1 {
						font-size: 38px;
					}

					.store-hero-copy p {
						font-size: 16px;
					}

					.store-actions {
						flex-direction: column;
					}

					.store-hero-orb {
						position: relative;
						right: auto;
						bottom: auto;
						width: 150px;
						height: 150px;
						align-self: center;
					}

					.store-preview-grid {
						grid-template-columns: 1fr;
					}

					.store-preview-card {
						padding: 22px;
					}
				}
			`}</style>
		</div>
	);
};

export default withLayoutBasic(StoreComingSoon);
