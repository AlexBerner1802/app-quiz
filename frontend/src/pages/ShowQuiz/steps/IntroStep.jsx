import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";
import Tag from "../../../components/ui/Tag";
import {useTranslation} from "react-i18next";
import ParticlesBackground from "../../../components/particules/ParticlesBackground";


export default function IntroStep({ quiz, onStart }) {

	const { t } = useTranslation();

	return (
		<>
			<ParticlesBackground preset="links" />

			<IntroCard>

				<Title>{quiz.title}</Title>

				<CoverContainer>
					<Cover src={quiz.cover_image_url} alt={quiz.title} />
					<OwnerLine>
						<span className="owner">Nom Owner</span>
						<span className="dot" />
						<span className="updated">Last update: 12.04.2026 18:30</span>
					</OwnerLine>
				</CoverContainer>

				{(quiz.modules?.length || quiz.tags?.length) > 0 && (
					<TagsContainer>
						{quiz.modules?.map((m, i) => <Tag key={i} size="l">{m.name}</Tag>)}
						{quiz.tags?.map((t, i) => <Tag key={i} variant="secondary" size="l">{t.name}</Tag>)}
					</TagsContainer>
				)}

				<Description>{quiz.description}</Description>

				<StartButton onClick={onStart} size="l">{t("quiz.start_quiz")}</StartButton>

			</IntroCard>
		</>
	);
}


const IntroCard = styled.div`
	display:flex; 
	flex-direction:column; 
	justify-content:center; 
	align-items:center; 
	gap:var(--spacing-l); 
	text-align:center;
    width: 100%;
	max-width: var(--spacing-14xl);
	margin: 0 auto;
	padding: var(--spacing);
    align-self: baseline;
    position: relative;
    z-index: 1;
`;

const Title = styled.p`
	font-size: var(--font-size-4xl); 
	font-weight: 600;
`;

const CoverContainer = styled.div`
    width:100%;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	margin-bottom: var(--spacing);
`;

const Cover = styled.img`
	width:100%;
    height: 30vh;
	object-fit:cover;
    border-radius:var(--border-radius-s);
    border: 1px solid var(--color-border);
    background-color: var(--color-background-surface-2);
	margin-bottom: var(--spacing-s);
`;

const OwnerLine = styled.div`
    display: flex;
    align-items: center;
	justify-content: center;
    gap: var(--spacing-2xs);
	padding: var(--spacing-2xs) var(--spacing-2xs) 0 var(--spacing); 
    width: 100%;

    .owner {
        font-size: var(--font-size-s);
        color: var(--color-input-placeholder);
        font-weight: 500;
    }

    .dot {
        width: 5px;
        height: 5px;
        background-color: var(--color-text-muted);
        border-radius: 50%;
		margin: 0 var(--spacing-s);
    }

    .updated {
        font-size: var(--font-size-s);
        color: var(--color-input-placeholder);
        font-weight: 500;
    }
`;


const Description = styled.p`
	font-size:var(--font-size-xl); 
	font-weight: 500;
	line-height:var(--line-height-xl);
`;

const TagsContainer = styled.div`
	display:flex; 
	flex-wrap:wrap; 
	gap:var(--spacing-xs); 
	justify-content:center; 
`;

const StartButton = styled(Button)`
	margin: var(--spacing-l) 0;
`;
