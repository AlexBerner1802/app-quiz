import styled from "styled-components";
import Tag from "./ui/Tag";
import { Pen } from "lucide-react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { Highlight } from "../utils/hightlight.jsx";
import Invader from "./icons/Invader";
import Button from "./ui/Button";
import { canManageContent } from "../utils/permissions.js";
import { useAuth } from "../context/auth";

export default function QuizCard({
									 quiz,
									 searchText = "",
									 loading = false,
									 onEdit,
									 onClick
								 }) {

	const { t } = useTranslation();
	const { dbUser } = useAuth();
	const canManage = canManageContent(dbUser)

	const {
		id,
		id_quiz,
		title,
		description,
		modules = [],
		tags = [],
		cover_image_url,
		created_at,
		updated_at,
		is_active = true,
		can_edit = false,
	} = quiz || {};

	const resolvedId = id_quiz ?? id;

	const safeClick = () => {
		if (!is_active) return;
		onClick?.(resolvedId);
	};

	const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || "http://localhost:8000";
	const resolvedImg = cover_image_url?.startsWith("/")
		? `${MEDIA_URL}${cover_image_url}`
		: cover_image_url;

	function renderTags(tags, maxVisible = 1) {
		const visibleTags = tags.slice(0, maxVisible);
		const hiddenCount = tags.length - visibleTags.length;

		return (
			<>
				{visibleTags.map((t) => (
					<Tag key={t.id} size={"s"} variant="secondary">{t.name}</Tag>
				))}
				{hiddenCount > 0 && <Tag size={"s"} variant="secondary" style={{ fontWeight: 500 }}>+{hiddenCount}</Tag>}
			</>
		);
	}


	return (
		<Container data-inactive={!is_active} $loading={loading} onClick={safeClick}>
			<ImageWrapper $loading={loading}>
				{loading ? (
					<>
						{/* Cover image skeleton */}
						<Skeleton width="100%" height="100%" />

						{/* Avatar skeleton */}
						<AvatarSkeleton />
					</>
				) : (
					<>
						<Image style={{ backgroundImage: `url(${resolvedImg})` }} data-inactive={!is_active} />
						{canManage && can_edit && (
							<EditButton
								variant="ghost"
								isIcon
								onClick={(e) => {
									e.stopPropagation();
									onEdit?.(resolvedId);
								}}
							>
								<Pen size={20} />
							</EditButton>
						)}

						<AvatarWrapper onClick={(e) => e.stopPropagation()}>
							{quiz.avatar_url ? (
								<AvatarImage src={quiz.avatar_url} alt="Author avatar" />
							) : (
								<FallbackIcon>
									<Invader size={32} color={"var(--color-primary-text)"} />
								</FallbackIcon>
							)}
						</AvatarWrapper>
					</>
				)}
			</ImageWrapper>

			<Section>
				<Title>
					{loading ? <Skeleton width="70%" /> : <Highlight text={title} query={searchText} />}
				</Title>

				<Description>
					{loading ? <Skeleton width="100%" /> : <Highlight text={description} query={searchText} />}
				</Description>

				<TagsContainer>
					{loading ? (
						<>
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={`tag-${i}`} width={80} height={24} style={{ borderRadius: 4 }} />
							))}
						</>
					) : (
						<>
							{modules.map((m) => (
								<Tag key={`module-${m.id}`} size={"s"}>{m.name}</Tag>
							))}

							{renderTags(tags, 1)}
						</>
					)}
				</TagsContainer>

			</Section>
		</Container>
	);
}

const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
    min-height: 376px;
	background-color: var(--color-background-surface-1);
	box-shadow: var(--box-shadow);
	border-radius: var(--border-radius-l);
    outline: 2px solid transparent;
	transition: all 0.2s ease;
    overflow: hidden;
	cursor: pointer;

	/* Disable hover if loading */
	&:hover {
		z-index: ${(props) => (props.$loading ? 'auto' : '1000')};
        outline: 2px solid var(--color-primary-bg-hover);
        background-color: var(--color-primary-muted);
		box-shadow: var(--box-shadow-l);
	}

	&[data-inactive="true"] {
		cursor: not-allowed;
		opacity: 0.9;
	}
	&[data-inactive="true"]:hover {
		transform: none;
	}
`;

const ImageWrapper = styled.div`
	position: relative;
	width: 100%;
	height: var(--spacing-6xl);
	min-height: var(--spacing-6xl);
	transition: height 0.3s ease-in-out;
	pointer-events: ${(props) => (props.$loading ? 'none' : 'auto')};
	background: var(--color-background-alt);
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

const EditButton = styled(Button)`
	position: absolute;
	top: var(--spacing-s);
	right: var(--spacing-s);
	background-color: var(--color-background-overlay);
	color: var(--color-primary-text);
	z-index: 10;
	
	&:hover {
        background-color: var(--color-background-overlay)!important;
	}
`;

const AvatarSkeleton = styled(Skeleton)`
	position: absolute !important;
	bottom: -24px;
	left: var(--spacing-l);
	width: 50px !important;
	height: 50px !important;
    border-radius: var(--border-radius-s);
	z-index: 30;
`;

const AvatarWrapper = styled.div`
	position: absolute;
	bottom: -24px;
	left: var(--spacing-l);
	z-index: 30;
	width: 50px;
	height: 50px;
	border-radius: var(--border-radius-s);
	background: var(--color-background-surface-2);
	border: 1px solid var(--color-border-subtle);
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: var(--box-shadow);
`;

const AvatarImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
    border-radius: var(--border-radius);
    border: 1px solid white;
`;

const FallbackIcon = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--border-radius);
`;

const Section = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
    padding: var(--spacing-l);
	transition: height 0.3s ease-in-out, opacity 0.2s ease, visibility 0.2s ease, padding 0.2s ease;
	border-radius: var(--border-radius);
	position: relative;
	z-index: 5;
`;

const Title = styled.p`
	font-size: var(--font-size-xl);
	font-weight: 500;
	margin: var(--spacing) 0 var(--spacing-xs);
	color: var(--color-text);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const Description = styled.p`
    font-size: var(--font-size);
    font-weight: 400;
    margin: 0 0 var(--spacing);
    color: var(--color-text-muted);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-height: 1.5;
    height: calc(1.5em * 2);
`;

const TagsContainer = styled.div`
  	display: flex;
	flex-wrap: wrap;
    gap: var(--spacing-xs);
	margin-top: var(--spacing-xs);
`;