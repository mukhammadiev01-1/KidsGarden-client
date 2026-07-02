import React, { useEffect, useState } from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Viewer } from '@toast-ui/react-editor';
import { Box, Stack, CircularProgress } from '@mui/material';

const escapeRawHtmlTags = (markdown: string): string => {
	return markdown.replace(/<\/?[a-zA-Z][^>\n]*>/g, (tag) =>
		tag.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
	);
};

const TViewer = (props: any) => {
	const [editorLoaded, setEditorLoaded] = useState(false);
	const safeMarkdown = typeof props.markdown === 'string' ? escapeRawHtmlTags(props.markdown) : '';

	/** LIFECYCLES **/
	useEffect(() => {
		if (props.markdown) {
			setEditorLoaded(true);
		} else {
			setEditorLoaded(false);
		}
	}, [props.markdown]);

	return (
		<Stack sx={{ background: 'white', mt: '30px', borderRadius: '10px' }}>
			<Box component={'div'} sx={{ m: '40px' }}>
				{editorLoaded ? (
					<Viewer initialValue={safeMarkdown} />
				) : (
					<CircularProgress />
				)}
			</Box>
		</Stack>
	);
};

export default TViewer;
