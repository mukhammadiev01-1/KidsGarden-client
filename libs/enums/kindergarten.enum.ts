export enum KindergartenType {
	PRIVATE_KINDERGARTEN = 'PRIVATE_KINDERGARTEN',
	PUBLIC_KINDERGARTEN = 'PUBLIC_KINDERGARTEN',
	DAYCARE_CENTER = 'DAYCARE_CENTER',
	PRESCHOOL = 'PRESCHOOL',
	EARLY_LEARNING_CENTER = 'EARLY_LEARNING_CENTER',
	APARTMENT = 'APARTMENT',
	VILLA = 'VILLA',
	HOUSE = 'HOUSE',
}

export enum KindergartenStatus {
	ACTIVE = 'ACTIVE',
	CLOSED = 'CLOSED',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}

export enum KindergartenLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}

export const DISCOVERY_KINDERGARTEN_TYPES: KindergartenType[] = [
	KindergartenType.PRIVATE_KINDERGARTEN,
	KindergartenType.PUBLIC_KINDERGARTEN,
	KindergartenType.DAYCARE_CENTER,
];

export const MANAGE_KINDERGARTEN_TYPES: KindergartenType[] = [
	KindergartenType.PRIVATE_KINDERGARTEN,
	KindergartenType.PUBLIC_KINDERGARTEN,
	KindergartenType.DAYCARE_CENTER,
	KindergartenType.PRESCHOOL,
	KindergartenType.EARLY_LEARNING_CENTER,
];

export const ACTIVE_KINDERGARTEN_STATUSES: KindergartenStatus[] = [
	KindergartenStatus.ACTIVE,
	KindergartenStatus.CLOSED,
	KindergartenStatus.DELETE,
];
