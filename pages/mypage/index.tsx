import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import MyMenu from '../../libs/components/mypage/MyMenu';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MemberFollowers from '../../libs/components/member/MemberFollowers';
import { sweetErrorHandling } from '../../libs/sweetAlert';
import MemberFollowings from '../../libs/components/member/MemberFollowings';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import MyKindergarten from '../../libs/components/mypage/MyKindergarten';
import { MemberType } from '../../libs/enums/member.enum';
import KindergartenStaff from '../../libs/components/mypage/KindergartenStaff';
import KindergartenGroups from '../../libs/components/mypage/KindergartenGroups';
import KindergartenChildren from '../../libs/components/mypage/KindergartenChildren';
import KindergartenAttendance from '../../libs/components/mypage/KindergartenAttendance';
import TeacherGroups from '../../libs/components/mypage/TeacherGroups';
import TeacherAttendance from '../../libs/components/mypage/TeacherAttendance';
import ParentChildren from '../../libs/components/mypage/ParentChildren';
import ParentAttendance from '../../libs/components/mypage/ParentAttendance';
import ParentStaffApplications from '../../libs/components/mypage/ParentStaffApplications';
import KindergartenStaffApplications from '../../libs/components/mypage/KindergartenStaffApplications';
import ParentKindergartenAdminApplications from '../../libs/components/mypage/ParentKindergartenAdminApplications';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MyPage: NextPage = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const isKindergartenAdmin = user.memberType === MemberType.KINDERGARTEN_ADMIN;
	const isTeacher = user.memberType === MemberType.TEACHER;
	const isParent = user.memberType === MemberType.PARENT;
	const isSuperAdmin = user.memberType === MemberType.SUPER_ADMIN;
	const rawCategory: any = router.query?.category;
	const legacyPropertyCategories = ['addProperty', 'myProperties'];
	const kindergartenAdminCategories = ['kindergartenProfile', 'staff', 'staffApplications', 'groups', 'children', 'attendance'];
	const teacherCategories = ['teacherGroups', 'teacherAttendance'];
	const parentCategories = ['parentChildren', 'parentAttendance', 'staffApplications', 'kindergartenAdminApplications'];
	const fallbackCategories = ['myFavorites', 'recentlyVisited', 'myArticles', 'writeArticle', 'myProfile', 'followers', 'followings'];
	const category: any =
		rawCategory ??
		(isKindergartenAdmin ? 'kindergartenProfile' : isTeacher ? 'teacherGroups' : isParent ? 'parentChildren' : 'myProfile');
	const dashboardCategory = isKindergartenAdmin
		? kindergartenAdminCategories.includes(category) && !legacyPropertyCategories.includes(category)
			? category
			: 'kindergartenProfile'
		: isTeacher
		? teacherCategories.includes(category) && !legacyPropertyCategories.includes(category)
			? category
			: 'teacherGroups'
		: isParent
		? parentCategories.includes(category) && !legacyPropertyCategories.includes(category)
			? category
			: 'parentChildren'
		: fallbackCategories.includes(category) && !legacyPropertyCategories.includes(category)
		? category
		: 'myProfile';

	/** APOLLO REQUESTS **/

	/** LIFECYCLES **/
	useEffect(() => {
		if (!user._id) router.push('/').then();
		else if (isSuperAdmin) router.push('/_admin').then();
	}, [user, isSuperAdmin, router]);

	/** HANDLERS **/
	const subscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const unsubscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	if (device === 'mobile') {
		return <div>MY PAGE</div>;
	} else {
		return (
			<div id="my-page" style={{ position: 'relative' }}>
				<div className="container">
					<Stack className={'my-page'}>
						<Stack className={'back-frame'}>
							<Stack className={'left-config'}>
								<MyMenu />
							</Stack>
							<Stack className="main-config" mb={'76px'}>
								<Stack className={'list-config'}>
									{dashboardCategory === 'kindergartenProfile' && <MyKindergarten />}
									{dashboardCategory === 'staff' && <KindergartenStaff />}
									{dashboardCategory === 'staffApplications' && isKindergartenAdmin && <KindergartenStaffApplications />}
									{dashboardCategory === 'groups' && <KindergartenGroups />}
									{dashboardCategory === 'children' && <KindergartenChildren />}
									{dashboardCategory === 'attendance' && <KindergartenAttendance />}
									{dashboardCategory === 'teacherGroups' && <TeacherGroups />}
									{dashboardCategory === 'teacherAttendance' && <TeacherAttendance />}
									{dashboardCategory === 'parentChildren' && <ParentChildren />}
									{dashboardCategory === 'parentAttendance' && <ParentAttendance />}
									{dashboardCategory === 'staffApplications' && isParent && <ParentStaffApplications />}
									{dashboardCategory === 'kindergartenAdminApplications' && isParent && (
										<ParentKindergartenAdminApplications />
									)}
									{dashboardCategory === 'myFavorites' && <MyFavorites />}
									{dashboardCategory === 'recentlyVisited' && <RecentlyVisited />}
									{dashboardCategory === 'myArticles' && <MyArticles />}
									{dashboardCategory === 'writeArticle' && <WriteArticle />}
									{dashboardCategory === 'myProfile' && <MyProfile />}
									{dashboardCategory === 'followers' && (
										<MemberFollowers
											subscribeHandler={subscribeHandler}
											unsubscribeHandler={unsubscribeHandler}
											redirectToMemberPageHandler={redirectToMemberPageHandler}
										/>
									)}
									{dashboardCategory === 'followings' && (
										<MemberFollowings
											subscribeHandler={subscribeHandler}
											unsubscribeHandler={unsubscribeHandler}
											redirectToMemberPageHandler={redirectToMemberPageHandler}
										/>
									)}
								</Stack>
							</Stack>
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

export default withLayoutBasic(MyPage);
