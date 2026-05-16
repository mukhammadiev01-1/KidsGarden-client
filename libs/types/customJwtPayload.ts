import { JwtPayload } from 'jwt-decode';
import { LegacyMemberType, MemberType } from '../enums/member.enum';

export interface CustomJwtPayload extends JwtPayload {
	_id: string;
	memberType: MemberType | LegacyMemberType | '';
	memberStatus: string;
	memberAuthType: string;
	memberPhone: string;
	memberNick: string;
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
	memberViews: number;
	memberWarnings: number;
	memberBlocks: number;
}
