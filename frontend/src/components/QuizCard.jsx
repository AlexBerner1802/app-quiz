import styled from "styled-components";
import { createTimestamp } from "../utils/dateUtils";
import Tag from "./ui/Tag";
import { SquareArrowOutUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";

export default function QuizCard(props) {

	const { t } = useTranslation();
	const { id, title, description, modules, tags, tagsTotal, imgURL, created_at, updated_at, isActive = true, onClick, onEdit, onDelete, loading } = props;

	const safeClick = () => {
		if (!isActive) return; // désactive l’ouverture plein cadre si inactif
		onClick?.();
	};


	const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
	const resolvedImg = imgURL?.startsWith("/") ? `${API_URL}${imgURL}` : imgURL;

	const safeModules = Array.isArray(modules)
		? modules
			.map((m) => (typeof m === "string" ? m : m?.module_name ?? m?.name ?? ""))
			.filter(Boolean)
		: [];

	const safeTags = Array.isArray(tags)
		? tags
			.map((t) => (typeof t === "string" ? t : t?.tag_name ?? t?.name ?? ""))
			.filter(Boolean)
		: [];


	return (
		<Container data-inactive={!isActive} $loading={loading} onClick={safeClick}>
			<ImageWrapper $loading={loading}>
				{loading ? (
					<Skeleton width="100%" height="100%" />
				) : (
					<>
						<Image style={{ backgroundImage: `url(${resolvedImg})` }} data-inactive={!isActive} />
						<Overlay>
							<SquareArrowOutUpRight size={32} color="var(--gray-50)" strokeWidth={2} />
							<OverlayTitle>{title}</OverlayTitle>
							<OverlayActions>
								<OverlayBtn type="button" onClick={(e) => { e.stopPropagation(); onEdit?.(id); }} title={t("actions.edit")}>{t("actions.edit")}</OverlayBtn>
								<OverlayBtn type="button" data-variant="danger" onClick={(e) => { e.stopPropagation(); onDelete?.(id); }} title={t("actions.delete")}>{t("actions.delete")}</OverlayBtn>
							</OverlayActions>
						</Overlay>
					</>
				)}
			</ImageWrapper>

			<Section>

				<Title>{loading ? <Skeleton width="70%" /> : title}</Title>
				<Description>{loading ? <Skeleton width="100%" /> : description}</Description>
				<Timestamp>{loading ? <Skeleton width="50%" /> : (created_at && updated_at && createTimestamp(created_at, updated_at))}</Timestamp>

				<TagsContainer>
					{loading ? (
						<>
							{Array.from({ length: 2 }).map((_, i) => (
								<Skeleton key={`module-${i}`} width={100} height={24} style={{ borderRadius: 4, marginRight: 4 }} />
							))}
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={`tag-${i}`} width={80} height={24} style={{ borderRadius: 4, marginRight: 4 }} />
							))}
						</>
					) : (
						<>
							{safeModules.slice(0, 3).map((m, i) => (
								<Tag key={`module-${i}`}>{m}</Tag>
							))}
							{safeModules.length > 3 && <Tag>+{safeModules.length - 3}</Tag>}

							{safeTags.map((tag, i) => (
								<Tag key={`tag-${i}`} variant="secondary">{tag}</Tag>
							))}
							{tagsTotal > 3 && <Tag variant="secondary">+{tagsTotal - 3}</Tag>}
						</>
					)}
				</TagsContainer>

			</Section>
		</Container>
	);
}

const ImageWrapper = styled.div`
	position: relative;
	width: 100%;
	height: var(--spacing-5xl);
	min-height: 128px;
	border-radius: var(--border-radius);
	overflow: hidden;
	transition: height 0.3s ease-in-out;
	pointer-events: ${(props) => (props.$loading ? 'none' : 'auto')};
`;


const Section = styled.div`
	flex: 1;
	background: var(--color-background);
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	padding: 0 var(--spacing-s) var(--spacing-s);
	transition: height 0.3s ease-in-out, opacity 0.2s ease, visibility 0.2s ease, padding 0.2s ease;
	border-radius: var(--border-radius);
`;

const Overlay = styled.div`
	position: absolute;
	inset: 0;
	background: var(--color-background-overlay);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	padding: var(--spacing);
	opacity: 0;
	visibility: hidden;
	transition: opacity 0.3s ease, visibility 0.3s ease;
	z-index: 1;
`;

const OverlayTitle = styled.h3`
	margin-top: var(--spacing);
	color: var(--gray-50);
	font-size: var(--font-size-xl);
	line-height: var(--line-height-l);
	font-weight: 600;
	text-align: center;
	opacity: 0;
	transform: scale(0.96);
	transition: opacity 0.4s ease, transform 0.4s ease;
	transition-delay: 0s;
`;

const Container = styled.div`
	display: flex;
	flex-direction: column;
	padding: var(--spacing-s);
	height: 100%;
	min-height: 280px;
	border-radius: var(--border-radius-s);
	border: 1px solid var(--color-border);
	transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
	cursor: pointer;

	/* Disable hover if loading */
	&:hover {
		z-index: ${(props) => (props.$loading ? 'auto' : '1000')};
	}
	&:hover ${ImageWrapper} {
		height: ${(props) => (props.$loading ? 'var(--spacing-5xl)' : '100%')};
	}
	&:hover ${Section} {
		opacity: ${(props) => (props.$loading ? '1' : '0')};
		visibility: ${(props) => (props.$loading ? 'visible' : 'hidden')};
		height: ${(props) => (props.$loading ? 'auto' : '0')};
		padding: ${(props) => (props.$loading ? '0 var(--spacing-s) var(--spacing-s)' : '0')};
		flex: ${(props) => (props.$loading ? '1' : '0')};
	}
	&:hover ${Overlay} {
		opacity: ${(props) => (props.$loading ? '0' : '1')};
		visibility: ${(props) => (props.$loading ? 'hidden' : 'visible')};
	}
	&:hover ${OverlayTitle} {
		opacity: ${(props) => (props.$loading ? '0' : '1')};
		transform: ${(props) => (props.$loading ? 'scale(0.96)' : 'scale(1)')};
		transition-delay: 0.1s;
	}

	&[data-inactive="true"] {
		cursor: not-allowed;
		opacity: 0.9;
	}
	&[data-inactive="true"]:hover {
		transform: none;
	}
`;

const Image = styled.div`
	width: 100%;
	height: 100%;
	background-size: cover;
	background-position: center;

	&[data-inactive="true"] {
		filter: grayscale(1) brightness(0.85);
	}
`;

const Title = styled.p`
	font-size: var(--font-size-xl);
	font-weight: 500;
	margin: var(--spacing) 0 var(--spacing-xs);
	color: var(--color-text);
`;

const Description = styled.p`
    font-size: var(--font-size);
    font-weight: 500;
    margin: 0 0 var(--spacing);
    color: var(--color-text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
    max-height: calc(1.5em * 3);
`;

const TagsRow = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: var(--spacing-xs);
`;

const Timestamp = styled.div`
	font-size: var(--font-size-xs);
	color: var(--color-text-muted);
	margin-top: auto;
	width: 100%;
`;

const TagsContainer = styled.div`
  	display: flex;
	flex-wrap: wrap;
    gap: var(--spacing-xs);
	margin-top: var(--spacing-xs);
`;

const ModulesRow = styled(TagsRow)`
  	margin-bottom: 0;
`;

const OverlayActions = styled.div`
	display: flex;
	gap: 8px;
	margin-top: var(--spacing);
	flex-wrap: wrap;
	justify-content: center;
`;

const OverlayBtn = styled.button`
	border: 1px solid #ffffff55;
	background: #ffffff22;
	color: #fff;
	padding: 6px 10px;
	border-radius: 8px;
	font-size: 12px;
	cursor: pointer;

	&:hover {
		background: #ffffff35;
	}

	&[data-variant="danger"] {
		border-color: #ef444455;
		background: #ef444422;
	}
`;
