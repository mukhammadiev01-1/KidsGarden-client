import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberUpdate!) {
		updateMemberByAdmin(input: $input) {
			_id
			memberType
			memberStatus
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberWarnings
			memberBlocks
			createdAt
			updatedAt
		}
	}
`;

export const APPROVE_KINDERGARTEN_ADMIN_APPLICATION = gql`
	mutation ApproveKindergartenAdminApplication($input: KindergartenAdminApplicationReviewInput!) {
		approveKindergartenAdminApplication(input: $input) {
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

export const REJECT_KINDERGARTEN_ADMIN_APPLICATION = gql`
	mutation RejectKindergartenAdminApplication($input: KindergartenAdminApplicationReviewInput!) {
		rejectKindergartenAdminApplication(input: $input) {
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

/**************************
 *      KINDERGARTEN      *
 *************************/

export const UPDATE_KINDERGARTEN_BY_ADMIN = gql`
	mutation UpdateKindergartenByAdmin($input: KindergartenUpdate!) {
		updateKindergartenByAdmin(input: $input) {
			_id
			kindergartenType
			kindergartenStatus
			kindergartenLocation
			kindergartenAddress
			kindergartenTitle
			kindergartenPrice
			kindergartenCapacity
			kindergartenAgeRange
			kindergartenPrograms
			kindergartenImages
			kindergartenViews
			kindergartenLikes
			kindergartenComments
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const UPDATE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation UpdateBoardArticleByAdmin($input: BoardArticleUpdate!) {
		updateBoardArticleByAdmin(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation RemoveBoardArticleByAdmin($input: String!) {
		removeBoardArticleByAdmin(articleId: $input) {
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

export const UPDATE_COMMENT_BY_ADMIN = gql`
	mutation UpdateCommentByAdmin($input: CommentAdminUpdate!) {
		updateCommentByAdmin(input: $input) {
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

export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($input: String!) {
		removeCommentByAdmin(commentId: $input) {
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
