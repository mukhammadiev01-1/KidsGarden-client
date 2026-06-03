import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../../enums/kindergarten.enum';

export interface KindergartenUpdate {
	_id: string;
	kindergartenType?: KindergartenType;
	kindergartenStatus?: KindergartenStatus;
	kindergartenLocation?: KindergartenLocation;
	kindergartenAddress?: string;
	kindergartenTitle?: string;
	monthlyFee?: number;
	kindergartenPrice?: number;
	kindergartenCapacity?: number;
	kindergartenAgeRange?: number;
	kindergartenPrograms?: number;
	kindergartenImages?: string[];
	kindergartenDesc?: string;
	deletedAt?: Date;
	establishedAt?: Date;
}
