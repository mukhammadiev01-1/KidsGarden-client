import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../../enums/kindergarten.enum';
import { Member } from '../member/member';

export interface MeLiked {
	memberId: string;
	likeRefId: string;
	myFavorite: boolean;
}

export interface TotalCounter {
	total: number;
}

export interface Kindergarten {
	_id: string;
	kindergartenType: KindergartenType;
	kindergartenStatus: KindergartenStatus;
	kindergartenLocation: KindergartenLocation;
	kindergartenAddress: string;
	kindergartenLatitude?: number;
	kindergartenLongitude?: number;
	kindergartenTitle: string;
	monthlyFee?: number;
	kindergartenPrice?: number;
	kindergartenCapacity: number;
	kindergartenAgeRange: number;
	kindergartenPrograms: number;
	kindergartenViews: number;
	kindergartenLikes: number;
	kindergartenComments: number;
	kindergartenRank: number;
	kindergartenImages: string[];
	kindergartenDesc?: string;
	memberId: string;
	deletedAt?: Date;
	establishedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	meLiked?: MeLiked[];
	memberData?: Member;
	distanceMeters?: number;
}

export interface Kindergartens {
	list: Kindergarten[];
	metaCounter: TotalCounter[];
}
