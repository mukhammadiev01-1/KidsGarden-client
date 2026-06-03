import { Direction } from '../../enums/common.enum';
import { KindergartenLocation, KindergartenStatus, KindergartenType } from '../../enums/kindergarten.enum';

export interface KindergartenInput {
	kindergartenType: KindergartenType;
	kindergartenLocation: KindergartenLocation;
	kindergartenAddress: string;
	kindergartenTitle: string;
	monthlyFee: number;
	kindergartenPrice?: number;
	kindergartenCapacity: number;
	kindergartenAgeRange: number;
	kindergartenPrograms: number;
	kindergartenImages: string[];
	kindergartenDesc?: string;
	memberId?: string;
	establishedAt?: Date;
}

interface Range {
	start: number;
	end: number;
}

interface PeriodsRange {
	start: Date | number;
	end: Date | number;
}

interface KISearch {
	memberId?: string;
	locationList?: KindergartenLocation[];
	typeList?: KindergartenType[];
	programsList?: Number[];
	ageRangeList?: Number[];
	monthlyFeeRange?: Range;
	pricesRange?: Range;
	periodsRange?: PeriodsRange;
	capacityRange?: Range;
	text?: string;
}

export interface KindergartensInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: KISearch;
}

interface OKISearch {
	kindergartenStatus?: KindergartenStatus;
}

export interface OwnerKindergartensInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: OKISearch;
}

interface AKISearch {
	kindergartenStatus?: KindergartenStatus;
	kindergartenLocationList?: KindergartenLocation[];
}

export interface AllKindergartensInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AKISearch;
}
