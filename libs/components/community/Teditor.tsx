import React, { useRef, useState } from 'react';
import { Box, Button, Stack, Typography, TextField } from '@mui/material';
import { useMutation, useReactiveVar } from '@apollo/client';
import { CREATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { MemberType } from '../../enums/member.enum';
import { Editor } from '@toast-ui/react-editor';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_GRAPHQL_URL, REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import axios from 'axios';
import { T } from '../../types/common';
import { sweetErrorAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import '@toast-ui/editor/dist/toastui-editor.css';

const TuiEditor = () => {
	const editorRef = useRef<Editor>(null),
		token = getJwtToken(),
		router = useRouter();
	const user = useReactiveVar(userVar);
	const [articleTitle, setArticleTitle] = useState<string>('');
	const [articleImage, setArticleImage] = useState<string>('');
	const [submitting, setSubmitting] = useState<boolean>(false);

	/** APOLLO REQUESTS **/
	const [createBoardArticle] = useMutation(CREATE_BOARD_ARTICLE);

	/** HANDLERS **/
	const uploadImage = async (image: any) => {
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target) 
				  }`,
					variables: {
						file: null,
						target: 'article',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', image);

			const response = await axios.post(REACT_APP_API_GRAPHQL_URL, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			console.log('=responseImage: ', responseImage);
			setArticleImage(responseImage);

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			console.log('Error, uploadImage:', err);
		}
	};

	const articleTitleHandler = (e: T) => {
		setArticleTitle(e.target.value);
	};

	const handleRegisterButton = async () => {
		try {
			if (user.memberType !== MemberType.PARENT) {
				await sweetErrorAlert('Only parents can write Parent Board posts.');
				return;
			}

			const articleContent = editorRef.current?.getInstance().getMarkdown().trim() ?? '';
			if (!articleTitle.trim()) {
				await sweetErrorAlert('Please enter a title.');
				return;
			}
			if (!articleContent) {
				await sweetErrorAlert('Please enter post content.');
				return;
			}

			setSubmitting(true);
			const { data } = await createBoardArticle({
				variables: {
					input: {
						articleCategory: BoardArticleCategory.FREE,
						articleTitle: articleTitle.trim(),
						articleContent,
						articleImage,
					},
				},
			});
			await sweetMixinSuccessAlert('Parent Board post created');

			const createdArticle = data?.createBoardArticle;
			if (createdArticle?._id) {
				await router.push({
					pathname: '/community/detail',
					query: { articleCategory: BoardArticleCategory.FREE, id: createdArticle._id },
				});
			} else {
				await router.push('/community?articleCategory=FREE');
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Stack>
			<Stack direction="row" style={{ margin: '40px' }} justifyContent="space-evenly">
				<Box component={'div'} className={'form_row'} style={{ width: '300px' }}>
					<Typography style={{ color: '#2f4f43', margin: '10px' }} variant="h3">
						Parent Board
					</Typography>
					<Typography style={{ color: '#6b7a72', margin: '10px', fontSize: '14px', lineHeight: '22px' }}>
						Share a question, experience, or helpful tip with other parents.
					</Typography>
				</Box>
				<Box component={'div'} style={{ width: '300px', flexDirection: 'column' }}>
					<Typography style={{ color: '#2f4f43', margin: '10px' }} variant="h3">
						Title
					</Typography>
					<TextField
						onChange={articleTitleHandler}
						value={articleTitle}
						id="filled-basic"
						label="Post title"
						style={{ width: '300px', background: 'white' }}
					/>
				</Box>
			</Stack>

			<Editor
				initialValue={''}
				placeholder={'Write your Parent Board post here'}
				previewStyle={'vertical'}
				height={'640px'}
				// @ts-ignore
				initialEditType={'WYSIWYG'}
				toolbarItems={[
					['heading', 'bold', 'italic', 'strike'],
					['image', 'table', 'link'],
					['ul', 'ol', 'task'],
				]}
				ref={editorRef}
				hooks={{
					addImageBlobHook: async (image: any, callback: any) => {
						const uploadedImageURL = await uploadImage(image);
						callback(uploadedImageURL);
						return false;
					},
				}}
				events={{
					load: function (param: any) {},
				}}
			/>

			<Stack direction="row" justifyContent="center">
				<Button
					variant="contained"
					color="primary"
					style={{ margin: '30px', width: '250px', height: '45px' }}
					onClick={handleRegisterButton}
					disabled={submitting}
				>
					{submitting ? 'Publishing...' : 'Publish Parent Board Post'}
				</Button>
			</Stack>
		</Stack>
	);
};

export default TuiEditor;
