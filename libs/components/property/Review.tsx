import React from 'react';
import { Stack, Typography } from '@mui/material';
import { Comment } from '../../types/comment/comment';
import { REACT_APP_API_URL } from '../../config';
import Moment from 'react-moment';

interface ReviewProps {
	comment: Comment;
}

const Review = (props: ReviewProps) => {
	const { comment } = props;
	const imagePath: string = comment?.memberData?.memberImage
		? `${REACT_APP_API_URL}/${comment?.memberData?.memberImage}`
		: '/img/profile/defaultUser.svg';

	return (
		<Stack className={'review-config'}>
			<Stack className={'review-mb-info'}>
				<Stack className={'img-name-box'}>
					<img src={imagePath} alt="" className={'img-box'} />
					<Stack>
						<Typography className={'name'}>
							{comment.memberData?.memberNick}
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
