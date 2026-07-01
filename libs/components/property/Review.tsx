import React from 'react';
import { Stack, Typography } from '@mui/material';
import { Comment } from '../../types/comment/comment';
import { getImageUrl } from '../../config';
import Moment from 'react-moment';

interface ReviewProps {
	comment: Comment;
}

const Review = (props: ReviewProps) => {
	const { comment } = props;
	const reviewerName = comment.memberData?.memberNick || comment.memberData?.memberFullName || 'Parent';
	const imagePath = getImageUrl(comment?.memberData?.memberImage, '/img/profile/defaultUser.svg');

	return (
		<Stack className={'review-config'}>
			<Stack className={'review-mb-info'}>
				<Stack className={'img-name-box'}>
					<img
						src={imagePath}
						alt={`${reviewerName} avatar`}
						className={'img-box review-avatar'}
						width={44}
						height={44}
					/>
					<Stack>
						<Typography className={'name'}>
							{reviewerName}
						</Typography>
						<Typography className={'date'}>
							<Moment format={'DD MMMM, YYYY'}>{comment.createdAt}</Moment>
						</Typography>
					</Stack>
				</Stack>
			</Stack>
			<Stack className={'desc-box'}>
				<Typography className={'description'}>{comment.commentContent}</Typography>
			</Stack>
		</Stack>
	);
};

export default Review;
