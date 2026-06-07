import React from 'react';
import { Box, Button, Dialog, Stack } from '@mui/material';

interface Props {
	open: boolean;
	imageUrl?: string;
	alt?: string;
	onClose: () => void;
}

const ChatImagePreview = ({ open, imageUrl, alt = 'Chat image preview', onClose }: Props) => {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<Stack spacing={1.5} sx={{ p: 2, background: '#101814' }}>
				<Stack direction="row" justifyContent="flex-end">
					<Button variant="outlined" size="small" onClick={onClose} sx={{ color: '#fff', borderColor: '#dce7df' }}>
						Close
					</Button>
				</Stack>
				{imageUrl && (
					<Box
						component="img"
						src={imageUrl}
						alt={alt}
						sx={{
							display: 'block',
							width: '100%',
							maxHeight: '75vh',
							objectFit: 'contain',
							borderRadius: '8px',
							background: '#fff',
						}}
					/>
				)}
			</Stack>
		</Dialog>
	);
};

export default ChatImagePreview;
