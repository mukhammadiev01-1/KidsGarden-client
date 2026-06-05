export enum MemberType {
	PARENT = 'PARENT',
	TEACHER = 'TEACHER',
	KINDERGARTEN_ADMIN = 'KINDERGARTEN_ADMIN',
	SUPER_ADMIN = 'SUPER_ADMIN',
}

export type LegacyMemberType = 'USER' | 'AGENT' | 'ADMIN';

export const memberTypeLabels: Record<MemberType, string> = {
	[MemberType.PARENT]: 'Parent',
	[MemberType.TEACHER]: 'Teacher',
	[MemberType.KINDERGARTEN_ADMIN]: 'Kindergarten Admin',
	[MemberType.SUPER_ADMIN]: 'Super Admin',
};

export const normalizeMemberType = (memberType?: MemberType | LegacyMemberType | string): MemberType | '' => {
	switch (memberType) {
		case 'USER':
		case MemberType.PARENT:
			return MemberType.PARENT;
		case 'AGENT':
		case MemberType.KINDERGARTEN_ADMIN:
			return MemberType.KINDERGARTEN_ADMIN;
		case 'ADMIN':
		case MemberType.SUPER_ADMIN:
			return MemberType.SUPER_ADMIN;
		case MemberType.TEACHER:
			return MemberType.TEACHER;
		default:
			return '';
	}
};

export const getMemberTypeLabel = (memberType?: MemberType | LegacyMemberType | string): string => {
	const normalizedMemberType = normalizeMemberType(memberType);

	return normalizedMemberType ? memberTypeLabels[normalizedMemberType] : '';
};

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}

export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	TELEGRAM = 'TELEGRAM',
	GOOGLE = 'GOOGLE',
}
