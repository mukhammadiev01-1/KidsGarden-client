import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked, TotalCounter } from '../kindergarten/kindergarten';
import { MeFollowed } from '../follow/follow';

export interface Member {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	memberPhone: string;
	memberNick: string;
	memberPassword?: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
	memberProperties?: number;
	memberKindergartens: number;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberFollowers?: number;
	memberFollowings?: number;
	memberViews: number;
	memberComments: number;
	memberWarnings: number;
	memberBlocks: number;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	// Enable for authentications
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	accessToken?: string;
}

export interface MemberPreview {
	_id: string;
	memberNick?: string;
	memberFullName?: string;
	memberImage?: string;
	memberPhone?: string;
	memberType?: MemberType;
	memberStatus?: MemberStatus;
}

export interface Members {
	list: Member[];
	metaCounter: TotalCounter[];
}
