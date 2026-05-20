import { CommentStatus } from '../../enums/comment.enum';

export interface CommentUpdate {
	_id: string;
	commentStatus?: CommentStatus;
	commentContent?: string;
}

export interface CommentAdminUpdate {
	_id: string;
	commentStatus: CommentStatus;
}
