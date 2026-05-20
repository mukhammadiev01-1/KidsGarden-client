import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';

export interface CommentInput {
	commentGroup: CommentGroup;
	commentContent: string;
	commentRefId: string;
	memberId?: string;
}

interface CISearch {
	commentRefId: string;
}

export interface CommentsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: CISearch;
}

interface ACISearch {
	commentStatus?: CommentStatus;
	commentGroup?: CommentGroup;
	commentRefId?: string;
	memberId?: string;
}

export interface AdminCommentsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ACISearch;
}
