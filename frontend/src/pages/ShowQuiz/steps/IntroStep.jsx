import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";
import Tag from "../../../components/ui/Tag";
import {useTranslation} from "react-i18next";


export default function IntroStep({ quiz, onStart }) {

	const { t } = useTranslation();

	return (
		<IntroCard>

			<Title>{quiz.title}</Title>

			{quiz.cover_image_url && <Cover src={quiz.cover_image_url} alt={quiz.title} />}

			<Description>{quiz.description}</Description>

			{(quiz.modules?.length || quiz.tags?.length) > 0 && (
				<TagsContainer>
					{quiz.modules?.map((m, i) => <Tag key={i} size="l">{m.name}</Tag>)}
					{quiz.tags?.map((t, i) => <Tag key={i} variant="secondary" size="l">{t.name}</Tag>)}
				</TagsContainer>
			)}

			<Button onClick={onStart} size="l">{t("quiz.start_quiz")}</Button>

		</IntroCard>
	);
}


const IntroCard = styled.div`
	display:flex; 
	flex-direction:column; 
	justify-content:center; 
	align-items:center; 
	gap:var(--spacing); 
	text-align:center;
`;

const Title = styled.p`
	font-size: var(--font-size-3xl); 
	font-weight:600;
`;

const Cover = styled.img`
	width:100%; 
	height:30vh; 
	object-fit:cover; 
	border-radius:var(--border-radius-s);
	border: 1px solid var(--color-border);
	background-color: var(--color-background-surface-2);
`;

const Description = styled.p`
	font-size:var(--font-size-l); 
	line-height:var(--line-height-xl);
`;

const TagsContainer = styled.div`
	display:flex; 
	flex-wrap:wrap; 
	gap:var(--spacing-xs); 
	justify-content:center; 
	margin-bottom:var(--spacing-xl);
`;
