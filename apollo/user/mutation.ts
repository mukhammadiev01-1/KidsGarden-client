import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberWarnings
			memberBlocks
			memberKindergartens
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberWarnings
			memberBlocks
			memberKindergartens
			memberRank
			memberPoints
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberKindergartens
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberWarnings
			memberBlocks
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

/**************************
 *      KINDERGARTEN      *
 *************************/

export const CREATE_KINDERGARTEN = gql`
	mutation CreateKindergarten($input: KindergartenInput!) {
		createKindergarten(input: $input) {
			_id
			kindergartenType
			kindergartenStatus
			kindergartenLocation
			kindergartenAddress
			kindergartenTitle
			monthlyFee
			kindergartenPrice
			kindergartenCapacity
			kindergartenAgeRange
			kindergartenPrograms
			kindergartenViews
			kindergartenLikes
			kindergartenComments
			kindergartenRank
			kindergartenImages
			kindergartenDesc
			memberId
			deletedAt
			establishedAt
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_KINDERGARTEN = gql`
	mutation UpdateKindergarten($input: KindergartenUpdate!) {
		updateKindergarten(input: $input) {
			_id
			kindergartenType
			kindergartenStatus
			kindergartenLocation
			kindergartenAddress
			kindergartenTitle
			monthlyFee
			kindergartenPrice
			kindergartenCapacity
			kindergartenAgeRange
			kindergartenPrograms
			kindergartenViews
			kindergartenLikes
			kindergartenComments
			kindergartenRank
			kindergartenImages
			kindergartenDesc
			memberId
			deletedAt
			establishedAt
			createdAt
			updatedAt
		}
	}
`;

export const CREATE_KINDERGARTEN_STAFF = gql`
	mutation CreateKindergartenStaff($input: KindergartenStaffInput!) {
		createKindergartenStaff(input: $input) {
			_id
			kindergartenId
			memberId
			staffRole
			staffStatus
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_KINDERGARTEN_STAFF = gql`
	mutation UpdateKindergartenStaff($input: KindergartenStaffUpdate!) {
		updateKindergartenStaff(input: $input) {
			_id
			kindergartenId
			memberId
			staffRole
			staffStatus
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_KINDERGARTEN_STAFF = gql`
	mutation RemoveKindergartenStaff($input: String!) {
		removeKindergartenStaff(kindergartenStaffId: $input) {
			_id
			kindergartenId
			memberId
			staffRole
			staffStatus
			createdAt
			updatedAt
		}
	}
`;

export const CREATE_STAFF_APPLICATION = gql`
	mutation CreateStaffApplication($input: StaffApplicationInput!) {
		createStaffApplication(input: $input) {
			_id
			kindergartenId
			applicantId
			requestedRole
			applicationStatus
			message
			reviewedBy
			reviewedAt
			rejectReason
			createdAt
			updatedAt
		}
	}
`;

export const CANCEL_STAFF_APPLICATION = gql`
	mutation CancelStaffApplication($applicationId: String!) {
		cancelStaffApplication(applicationId: $applicationId) {
			_id
			kindergartenId
			applicantId
			requestedRole
			applicationStatus
			message
			reviewedBy
			reviewedAt
			rejectReason
			createdAt
			updatedAt
		}
	}
`;

export const APPROVE_STAFF_APPLICATION = gql`
	mutation ApproveStaffApplication($input: StaffApplicationReviewInput!) {
		approveStaffApplication(input: $input) {
			_id
			kindergartenId
			applicantId
			requestedRole
			applicationStatus
			message
			reviewedBy
			reviewedAt
			rejectReason
			createdAt
			updatedAt
		}
	}
`;

export const REJECT_STAFF_APPLICATION = gql`
	mutation RejectStaffApplication($input: StaffApplicationReviewInput!) {
		rejectStaffApplication(input: $input) {
			_id
			kindergartenId
			applicantId
			requestedRole
			applicationStatus
			message
			reviewedBy
			reviewedAt
			rejectReason
			createdAt
			updatedAt
		}
	}
`;

export const CREATE_KINDERGARTEN_ADMIN_APPLICATION = gql`
	mutation CreateKindergartenAdminApplication($input: KindergartenAdminApplicationInput!) {
		createKindergartenAdminApplication(input: $input) {
			_id
			applicantId
			applicationStatus
			message
			kindergartenTitle
			kindergartenAddress
			kindergartenPhone
			businessInfo
			reviewedBy
			reviewedAt
			rejectReason
			createdAt
			updatedAt
		}
	}
`;

export const CANCEL_KINDERGARTEN_ADMIN_APPLICATION = gql`
	mutation CancelKindergartenAdminApplication($applicationId: String!) {
		cancelKindergartenAdminApplication(applicationId: $applicationId) {
			_id
			applicantId
			applicationStatus
			message
			kindergartenTitle
			kindergartenAddress
			kindergartenPhone
			businessInfo
			reviewedBy
			reviewedAt
			rejectReason
			createdAt
			updatedAt
		}
	}
`;

export const CREATE_GROUP = gql`
	mutation CreateGroup($input: GroupInput!) {
		createGroup(input: $input) {
			_id
			kindergartenId
			groupName
			groupAgeRange
			groupCapacity
			teacherIds
			groupStatus
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_GROUP = gql`
	mutation UpdateGroup($input: GroupUpdate!) {
		updateGroup(input: $input) {
			_id
			kindergartenId
			groupName
			groupAgeRange
			groupCapacity
			teacherIds
			groupStatus
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_GROUP = gql`
	mutation RemoveGroup($input: String!) {
		removeGroup(groupId: $input) {
			_id
			kindergartenId
			groupName
			groupAgeRange
			groupCapacity
			teacherIds
			groupStatus
			createdAt
			updatedAt
		}
	}
`;

export const CREATE_CHILD = gql`
	mutation CreateChild($input: ChildInput!) {
		createChild(input: $input) {
			_id
			childFullName
			childBirthDate
			childGender
			childImage
			childStatus
			parentId
			kindergartenId
			groupId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_CHILD = gql`
	mutation UpdateChild($input: ChildUpdate!) {
		updateChild(input: $input) {
			_id
			childFullName
			childBirthDate
			childGender
			childImage
			childStatus
			parentId
			kindergartenId
			groupId
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_CHILD = gql`
	mutation RemoveChild($input: String!) {
		removeChild(childId: $input) {
			_id
			childFullName
			childBirthDate
			childGender
			childImage
			childStatus
			parentId
			kindergartenId
			groupId
			createdAt
			updatedAt
		}
	}
`;

export const MARK_ATTENDANCE = gql`
	mutation MarkAttendance($input: AttendanceInput!) {
		markAttendance(input: $input) {
			_id
			childId
			kindergartenId
			groupId
			attendanceDate
			attendanceStatus
			markedBy
			note
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_ATTENDANCE = gql`
	mutation UpdateAttendance($input: AttendanceUpdate!) {
		updateAttendance(input: $input) {
			_id
			childId
			kindergartenId
			groupId
			attendanceDate
			attendanceStatus
			markedBy
			note
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_ATTENDANCE = gql`
	mutation RemoveAttendance($input: String!) {
		removeAttendance(attendanceId: $input) {
			_id
			childId
			kindergartenId
			groupId
			attendanceDate
			attendanceStatus
			markedBy
			note
			createdAt
			updatedAt
		}
	}
`;

export const LIKE_TARGET_KINDERGARTEN = gql`
	mutation LikeTargetKindergarten($input: String!) {
		likeTargetKindergarten(kindergartenId: $input) {
			_id
			kindergartenType
			kindergartenStatus
			kindergartenLocation
			kindergartenAddress
			kindergartenTitle
			monthlyFee
			kindergartenPrice
			kindergartenCapacity
			kindergartenAgeRange
			kindergartenPrograms
			kindergartenViews
			kindergartenLikes
			kindergartenComments
			kindergartenRank
			kindergartenImages
			kindergartenDesc
			memberId
			deletedAt
			establishedAt
			createdAt
			updatedAt
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const CREATE_BOARD_ARTICLE = gql`
	mutation CreateBoardArticle($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_BOARD_ARTICLE = gql`
	mutation UpdateBoardArticle($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const LIKE_TARGET_BOARD_ARTICLE = gql`
	mutation LikeTargetBoardArticle($input: String!) {
		likeTargetBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: String!) {
		subscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: String!) {
		unsubscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *       APPLICATION      *
 *************************/

export const CREATE_APPLICATION = gql`
	mutation CreateApplication($input: ApplicationInput!) {
		createApplication(input: $input) {
			_id
			parentId
			kindergartenId
			kindergartenOwnerId
			childName
			childAge
			parentMessage
			adminNote
			documents {
				url
				name
				mimeType
				size
			}
			status
			reviewedBy
			reviewedAt
			canceledAt
			createdAt
			updatedAt
		}
	}
`;

export const APPLICATION_DOCUMENTS_UPLOADER = gql`
	mutation ApplicationDocumentsUploader($files: [Upload!]!) {
		applicationDocumentsUploader(files: $files) {
			url
			name
			mimeType
			size
		}
	}
`;

export const UPDATE_APPLICATION_STATUS = gql`
	mutation UpdateApplicationStatus($input: ApplicationStatusUpdateInput!) {
		updateApplicationStatus(input: $input) {
			_id
			parentId
			kindergartenId
			kindergartenOwnerId
			childName
			childAge
			parentMessage
			adminNote
			documents {
				url
				name
				mimeType
				size
			}
			status
			reviewedBy
			reviewedAt
			canceledAt
			createdAt
			updatedAt
		}
	}
`;

export const CANCEL_APPLICATION = gql`
	mutation CancelApplication($applicationId: String!) {
		cancelApplication(applicationId: $applicationId) {
			_id
			parentId
			kindergartenId
			kindergartenOwnerId
			childName
			childAge
			parentMessage
			adminNote
			documents {
				url
				name
				mimeType
				size
			}
			status
			reviewedBy
			reviewedAt
			canceledAt
			createdAt
			updatedAt
		}
	}
`;
