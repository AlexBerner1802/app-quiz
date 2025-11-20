import styled from "styled-components";
import { createTimestamp } from "../utils/dateUtils";
import Tag from "./ui/Tag";
import { SquareArrowOutUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";

export default function QuizCard(props) {

	const { t } = useTranslation();
	const { id, title, modules, tags, tagsTotal, imgURL, date, modified, isActive = true, onClick, onEdit, onDelete, loading } = props;

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
				{
					loading ?
						<Skeleton width={"100%"} height={"100%"} /> :
						<>
							<Image style={{ backgroundImage: `url(${resolvedImg})` }} data-inactive={!isActive} />
							<Overlay>
								<SquareArrowOutUpRight size={32} color="var(--gray-50)" strokeWidth={2} />
								<OverlayTitle>{title}</OverlayTitle>
								<OverlayActions>
									<OverlayBtn
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onEdit?.(id);
										}}
										title={t("actions.edit")}
										aria-label={t("actions.edit")}
									>
										{t("actions.edit")}
									</OverlayBtn>
									<OverlayBtn
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onDelete?.(id);
										}}
										title={t("actions.delete")}
										aria-label={t("actions.delete")}
										data-variant="danger"
									>
										{t("actions.delete")}
									</OverlayBtn>
								</OverlayActions>
							</Overlay>
						</>
				}

				{!isActive && !loading && <Ribbon>{t("common.inactive")}</Ribbon>}
			</ImageWrapper>

			<Section>
				<Title>
					{
						title || <Skeleton width={"70%"} height={"var(--font-size)"}/>
					}
				</Title>

				{loading ? (
					<ModulesRow>
						{Array.from({ length: 2 }).map((_, i) => (
							<Skeleton key={i} width={100} height={24} style={{ borderRadius: 4 }} />
						))}
					</ModulesRow>
				) : (
					safeModules.length > 0 && (
						<ModulesRow>
							{safeModules.slice(0, 3).map((mod, i) => (
								<Tag key={i} variant="primary">
									{mod}
								</Tag>
							))}
							{safeModules.length > 3 && <Tag variant="primary">+{safeModules.length - 3}</Tag>}
						</ModulesRow>
					)
				)}

				{loading ? (
					<TagsRow>
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} width={80} height={24} style={{ borderRadius: 4 }} />
						))}
					</TagsRow>
				) : (
					<TagsRow>
						{safeTags.map((tag, index) => (
							<Tag key={index} variant="secondary">
								{tag}
							</Tag>
						))}
						{typeof tagsTotal === "number" && tagsTotal > 3 && (
							<Tag variant="secondary">+{tagsTotal - 3}</Tag>
						)}
					</TagsRow>
				)}

				<Timestamp>{(date && modified && createTimestamp(date, modified)) || <Skeleton width={"50%"} height={"var(--font-size-xs)"}/>}</Timestamp>
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

	/* Disable pointer events if loading */
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
	padding: 1px;
	height: 100%;
	min-height: 280px;
	border-radius: var(--border-radius);
	border: 2px solid var(--color-border);
	transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
	cursor: pointer;

	/* Disable hover if loading */
	&:hover {
		transform: ${(props) => (props.$loading ? 'none' : 'scale(1.05)')};
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

const Ribbon = styled.div`
	position: absolute;
	top: 10px;
	left: 10px;
	background: #111827cc;
	color: #fff;
	font-size: 11px;
	font-weight: 700;
	padding: 4px 8px;
	border-radius: 999px;
	z-index: 2;
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
	height: 40px;
	font-size: var(--font-size);
	line-height: var(--line-height-l);
	font-weight: 500;
	margin: var(--spacing-s) 0 var(--spacing-xs);
	color: var(--color-text);
`;

const TagsRow = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: var(--spacing-2xs);
	margin-bottom: var(--spacing);

`;

const Timestamp = styled.div`
	font-size: var(--font-size-xs);
	color: var(--color-text-muted);
	margin-top: auto;
	width: 100%;
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
