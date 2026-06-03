import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;

export const GET_KINDERGARTEN_ADMIN_APPLICATIONS = gql`
	query GetKindergartenAdminApplications($input: KindergartenAdminApplicationsInquiry!) {
		getKindergartenAdminApplications(input: $input) {
			list {
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
				applicantData {
					_id
					memberNick
					memberFullName
					memberImage
					memberPhone
					memberType
					memberStatus
				}
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_STAFF_APPLICATIONS = gql`
	query GetStaffApplications($input: StaffApplicationsInquiry!) {
		getStaffApplications(input: $input) {
			list {
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
				applicantData {
					_id
					memberNick
					memberFullName
					memberImage
					memberPhone
					memberType
					memberStatus
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *      KINDERGARTEN      *
 *************************/

export const GET_ALL_KINDERGARTENS_BY_ADMIN = gql`
	query GetAllKindergartensByAdmin($input: AllKindergartensInquiry!) {
		getAllKindergartensByAdmin(input: $input) {
			list {
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
				kindergartenImages
				kindergartenViews
				kindergartenLikes
				kindergartenComments
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberDesc
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_ALL_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetAllBoardArticlesByAdmin($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
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
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberDesc
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_ALL_COMMENTS_BY_ADMIN = gql`
	query GetAllCommentsByAdmin($input: AdminCommentsInquiry!) {
		getAllCommentsByAdmin(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberDesc
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *       APPLICATION      *
 *************************/

export const GET_ALL_APPLICATIONS_FOR_ADMIN = gql`
	query GetAllApplicationsForAdmin($input: ApplicationsInquiry!) {
		getAllApplicationsForAdmin(input: $input) {
			list {
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
				parentData {
					_id
					memberNick
					memberFullName
					memberImage
				}
				kindergartenData {
					_id
					kindergartenTitle
					kindergartenLocation
					kindergartenAddress
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
