import { gql } from '@apollo/client';

export const GET_MEMBER = gql(`
	query GetMember($input: String!) {
	    getMember(memberId: $input) {
	        _id
	        memberNick
	        memberFullName
	        memberImage
	        memberDesc
	    }
	}
	`);

export const PREVIEW_KINDERGARTEN_MEMBER = gql`
	query PreviewKindergartenMember($input: PreviewKindergartenMemberInput!) {
		previewKindergartenMember(input: $input) {
			_id
			memberNick
			memberFullName
			memberImage
			memberPhone
			memberType
			memberStatus
		}
	}
`;

/**************************
 *      KINDERGARTEN      *
 *************************/

export const GET_KINDERGARTEN = gql`
	query GetKindergarten($input: String!) {
		getKindergarten(kindergartenId: $input) {
			_id
			kindergartenType
			kindergartenStatus
			kindergartenLocation
			kindergartenAddress
			kindergartenLatitude
			kindergartenLongitude
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
				memberData {
						_id
						memberNick
						memberFullName
						memberImage
						memberDesc
					}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_KINDERGARTENS = gql`
	query GetKindergartens($input: KindergartensInquiry!) {
		getKindergartens(input: $input) {
			list {
				_id
				kindergartenType
				kindergartenStatus
				kindergartenLocation
				kindergartenAddress
				kindergartenLatitude
				kindergartenLongitude
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
					memberData {
						_id
						memberNick
						memberFullName
						memberImage
						memberDesc
					}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_NEARBY_KINDERGARTENS = gql`
	query GetNearbyKindergartens($input: NearbyKindergartensInput!) {
		getNearbyKindergartens(input: $input) {
			list {
				_id
				kindergartenType
				kindergartenStatus
				kindergartenLocation
				kindergartenAddress
				kindergartenLatitude
				kindergartenLongitude
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
				createdAt
				updatedAt
				distanceMeters
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberDesc
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_NEARBY_KINDERGARTENS_BY_ADDRESS = gql`
	query GetNearbyKindergartensByAddress($input: NearbyKindergartensByAddressInput!) {
		getNearbyKindergartensByAddress(input: $input) {
			list {
				_id
				kindergartenType
				kindergartenStatus
				kindergartenLocation
				kindergartenAddress
				kindergartenLatitude
				kindergartenLongitude
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
				createdAt
				updatedAt
				distanceMeters
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberDesc
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
			searchCenterLatitude
			searchCenterLongitude
			searchAddress
			resolvedAddress
		}
	}
`;

export const GEOCODE_KINDERGARTEN_ADDRESS = gql`
	query GeocodeKindergartenAddress($address: String!) {
		geocodeKindergartenAddress(address: $address) {
			address
			roadAddress
			jibunAddress
			latitude
			longitude
		}
	}
`;

export const GET_OWNER_KINDERGARTENS = gql`
	query GetOwnerKindergartens($input: OwnerKindergartensInquiry!) {
		getOwnerKindergartens(input: $input) {
			list {
				_id
				kindergartenType
				kindergartenStatus
				kindergartenLocation
				kindergartenAddress
				kindergartenLatitude
				kindergartenLongitude
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
			metaCounter {
				total
			}
		}
	}
`;

export const GET_KINDERGARTEN_STAFFS = gql`
	query GetKindergartenStaffs($input: KindergartenStaffsInquiry!) {
		getKindergartenStaffs(input: $input) {
			list {
				_id
				kindergartenId
				memberId
				staffRole
				staffStatus
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const SEARCH_STAFF_CANDIDATES = gql`
	query SearchStaffCandidates($input: StaffCandidatesInquiry!) {
		searchStaffCandidates(input: $input) {
			list {
				_id
				memberNick
				memberPhone
				memberType
				memberStatus
				memberImage
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_STAFF_APPLICATIONS = gql`
	query GetMyStaffApplications($input: StaffApplicationsInquiry!) {
		getMyStaffApplications(input: $input) {
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

export const GET_MY_KINDERGARTEN_ADMIN_APPLICATIONS = gql`
	query GetMyKindergartenAdminApplications($input: KindergartenAdminApplicationsInquiry!) {
		getMyKindergartenAdminApplications(input: $input) {
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
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_GROUPS = gql`
	query GetGroups($input: GroupsInquiry!) {
		getGroups(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;

export const GET_GROUP = gql`
	query GetGroup($groupId: String!) {
		getGroup(groupId: $groupId) {
			_id
			kindergartenId
			groupName
			groupAgeRange
			groupCapacity
			teacherIds
			groupStatus
		}
	}
`;

export const GET_CHILDREN = gql`
	query GetChildren($input: ChildrenInquiry!) {
		getChildren(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;

export const GET_ATTENDANCES = gql`
	query GetAttendances($input: AttendancesInquiry!) {
		getAttendances(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;

export const GET_FAVORITES = gql`
	query GetFavorites($input: OrdinaryInquiry!) {
		getFavorites(input: $input) {
			list {
				_id
				kindergartenType
				kindergartenStatus
				kindergartenLocation
				kindergartenAddress
				kindergartenLatitude
				kindergartenLongitude
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

export const GET_VISITED = gql`
	query GetVisited($input: OrdinaryInquiry!) {
		getVisited(input: $input) {
			list {
				_id
				kindergartenType
				kindergartenStatus
				kindergartenLocation
				kindergartenAddress
				kindergartenLatitude
				kindergartenLongitude
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

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
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
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
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
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
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

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
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
 *         FOLLOW        *
 *************************/
export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
					followerData {
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

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
					followingData {
						_id
						memberNick
						memberFullName
						memberImage
						memberDesc
					}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
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

export const GET_MY_APPLICATIONS = gql`
	query GetMyApplications($input: ApplicationsInquiry!) {
		getMyApplications(input: $input) {
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

export const GET_KINDERGARTEN_APPLICATIONS = gql`
	query GetKindergartenApplications($input: ApplicationsInquiry!) {
		getKindergartenApplications(input: $input) {
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
