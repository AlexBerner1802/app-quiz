import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {Search, Trophy, Pen } from "lucide-react";

import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";

import { useDrawer } from "../../context/drawer";
import Skeleton from "react-loading-skeleton";
import Invader from "../../components/icons/Invader";
import Button from "../../components/ui/Button";
import {applyScoreMultiplier} from "../../utils/score";

/* ───── TIME FORMATTING ───── */
function formatTime(sec) {
	if (sec >= 3600) return `> 1h`;
	const s = Math.max(0, Math.floor(sec || 0));
	const m = Math.floor(s / 60);
	const r = s % 60;
	return `${m}m ${String(r).padStart(2, "0")}s`;
}

/* ───── ANIMATED COUNTER HOOK ───── */
function useAnimatedCounter(target, duration = 2000) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		const safeTarget = Number(target) || 0;
		const startValue = value; // start from current value
		const startTime = performance.now();

		if (safeTarget === 0) {
			setValue(0);
			return;
		}

		function step(now) {
			const progress = Math.min((now - startTime) / duration, 1);
			setValue(Math.round(startValue + progress * (safeTarget - startValue)));
			if (progress < 1) requestAnimationFrame(step);
		}

		requestAnimationFrame(step);
	}, [target, duration]);

	// format with a space every 3 digits
	return value.toLocaleString('fr-FR'); 
}

const CircleStat = ({
						label,
						value,
						maxValue,
						unit = "",
						reverse = false,
						description,
						strokeColor = "var(--color-background-surface-2)",
						strokeFillColor = "var(--color-primary-bg)",
						shadowColor = "var(--color-primary-muted-text)"
					}) => {
	const radius = 100;
	const stroke = 12;
	let normalized = value / maxValue;

	if (reverse) normalized = 1 - normalized; // reverse fill for avgSpeed

	const circumference = 2 * Math.PI * radius;
	const offset = circumference * (1 - normalized);

	return (
		<CircleStatWrap>
			<svg width={radius * 2 + stroke * 4} height={radius * 2 + stroke * 4}>
				{/* Define drop shadow filter */}
				<defs>
					<filter id="outerShadow" x="-50%" y="-50%" width="300%" height="300%">
						<feDropShadow
							dx="0"
							dy="0"
							stdDeviation="4"
							floodColor={shadowColor}
						/>
					</filter>
				</defs>

				{/* Background circle */}
				<circle
					r={radius}
					cx={radius + stroke * 2}
					cy={radius + stroke * 2}
					stroke={strokeColor}
					strokeWidth={stroke}
					fill="transparent"
				/>

				{/* Progress circle with outer shadow */}
				<circle
					r={radius}
					cx={radius + stroke * 2}
					cy={radius + stroke * 2}
					stroke={strokeFillColor}
					strokeWidth={stroke}
					fill="transparent"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					style={{ transition: "stroke-dashoffset 1s ease-out" }}
					filter="url(#outerShadow)" // apply outer shadow
				/>

				{/* Center text */}
				<text
					x="50%"
					y="50%"
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize="var(--font-size-2xl)"
					fontWeight="600"
					fill="var(--color-text)"
				>
					{label === "Avg Speed" && value >= maxValue
						? `> ${formatTime(maxValue)}`
						: `${Math.round(value)}${unit}`}
				</text>
			</svg>

			<CircleLabel>{label}</CircleLabel>
			<CircleDesc>{description}</CircleDesc>
		</CircleStatWrap>
	);
};




export default function ProfilePage() {
	const { t } = useTranslation();
	const { openDrawer } = useDrawer();
	const { id_user } = useParams();

	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState({ name: "", role: "", avatarUrl: null, username: "" });
	const [stats, setStats] = useState({ totalAttempts: 0, true: 0, false: 0, totalPoints: 0, totalTimeSec: 0, bestScore: 0 });
	const [quizzes, setQuizzes] = useState([]);
	const [searchText, setSearchText] = useState("");

	useEffect(() => {
		if (!id_user) return;
		(async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id_user}/profile?lang=fr`);
				if (!res.ok) throw new Error("Failed to load profile");
				const data = await res.json();

				setUser({
					name: data.user?.name ?? "",
					role: data.user?.roleName ?? "",
					avatarUrl: data.user?.avatar ?? null,
					username: data.user?.username ?? "",
					created_at: data.user?.created_at ?? "",
				});

				setStats({
					totalAttempts: data.stats?.totalAttempts ?? 0,
					true: data.stats?.true ?? 0,
					false: data.stats?.false ?? 0,
					totalPoints: data.stats?.totalPoints ?? 0,
					totalTimeSec: data.stats?.totalTimeSec ?? 0,
					goldTrophy: data.stats?.goldTrophy ?? 0,
					silverTrophy: data.stats?.silverTrophy ?? 0,
					bronzeTrophy: data.stats?.bronzeTrophy ?? 0,
				});

				setQuizzes(Array.isArray(data.quizzes) ? data.quizzes : []);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [id_user]);

	const filteredQuizzes = useMemo(() => {
		const q = searchText.trim().toLowerCase();
		if (!q) return quizzes;
		return quizzes.filter((quiz) => (quiz.title ?? "").toLowerCase().includes(q));
	}, [quizzes, searchText]);


	/* ───── PERFORMANCE METRICS ───── */
	const expectedAttemptsPerQuiz = 2; // easy to update later
	const performance = useMemo(() => {
		const totalAnswers = stats.true + stats.false;
		const accuracy = totalAnswers > 0 ? stats.true / totalAnswers : 0;
		const avgSpeed = stats.totalAttempts > 0 ? stats.totalTimeSec / stats.totalAttempts : 0;

		const consistencyRaw =
			quizzes.length > 0
				? Math.min(stats.totalAttempts / (quizzes.length * expectedAttemptsPerQuiz), 1)
				: 0;
		const consistency = consistencyRaw; // now 0 → 1 scale

		const efficiency = avgSpeed > 0 ? accuracy / (avgSpeed / 60 + 1) : 0;
		const retryRate = quizzes.length > 0 ? stats.totalAttempts / quizzes.length : 0;

		return { accuracy, avgSpeed, consistency, efficiency, retryRate };
	}, [stats, quizzes]);

	const safeTarget = applyScoreMultiplier(stats.totalPoints, false) || 0;

	const bestScoreAnimated = useAnimatedCounter(safeTarget, 2500);

	const handleQuizClick = (quiz) => {
		openDrawer("quizResult", { quiz: { ...quiz, owner: user.name || "Me" }, id_user });
	};

	return (
		<Main>
			<FaviconTitle icon={faviconUrl} title={t("pages.accountPage")} />

			<Content>
				<ContentHead>
					<TitleContainer>
						<Invader size={54} aria-hidden="true" color={"var(--color-text)"}/>
						<Title>{t("profile.title")}</Title>
						<ToggleThemeSwitch/>
					</TitleContainer>
				</ContentHead>

				<ProfileCard>

					<Identity>
						{loading ? (
							<AvatarSkeleton />
						) : (
							<AvatarWrapper onClick={(e) => e.stopPropagation()}>
								{user.avatarUrl ? (
									<AvatarImage src={user.avatarUrl} alt="Author avatar" />
								) : (
									<FallbackIcon>
										<Invader size={60} color="var(--color-primary-text)" />
									</FallbackIcon>
								)}
							</AvatarWrapper>
						)}

						<IdentityInfo>
							<ProfileName>{user.name || "—"}</ProfileName>
							<ProfileRegister>{user.created_at || "Registered Dec. 17th 2025, 12:05:06"}</ProfileRegister>
						</IdentityInfo>

						<Button variant={"outline"}>
							<Pen size={20} />
							{t("common.edit")}
						</Button>
					</Identity>

					<StatsContainer>
						<StatList>
							<StatRow><StatLabel>{t("profile.true")} / {t("profile.false")}</StatLabel><StatValue>{stats.true || "-"} / {stats.false || "-"}</StatValue></StatRow>
							<StatRow><StatLabel>{t("profile.totalFinish")}</StatLabel><StatValue>{stats.totalAttempts || "-"}</StatValue></StatRow>
							<StatRow><StatLabel>{t("profile.totalAttempts")}</StatLabel><StatValue>{stats.totalAttempts || "-"}</StatValue></StatRow>
							<StatRow><StatLabel>{t("profile.totalTime")}</StatLabel><StatValue>{formatTime(stats.totalTimeSec) || "-"}</StatValue></StatRow>
							<StatRow><StatLabel>{t("leaderboard.rank")}</StatLabel><StatValue>{stats.rank || "-"}</StatValue></StatRow>
						</StatList>

						<TopScoreContainer>
							<TopScoreLabel>{t("common.top_score")}</TopScoreLabel>
							<TopScore>{bestScoreAnimated}</TopScore>

							<TrophyRow>
								<TrophyColumn>
									<TrophyCircle>
										<Trophy size={28} color={"var(--first-place)"} />
									</TrophyCircle>
									<TrophyCount>{stats.goldTrophy || 0}</TrophyCount>
								</TrophyColumn>
								<TrophyColumn>
									<TrophyCircle>
										<Trophy size={28} color={"var(--second-place)"} />
									</TrophyCircle>
									<TrophyCount>{stats.silverTrophy || 0}</TrophyCount>
								</TrophyColumn>
								<TrophyColumn>
									<TrophyCircle>
										<Trophy size={28} color={"var(--third-place)"} />
									</TrophyCircle>
									<TrophyCount>{stats.bronzeTrophy || 0}</TrophyCount>
								</TrophyColumn>
							</TrophyRow>
						</TopScoreContainer>
					</StatsContainer>
				</ProfileCard>

				<CircleStatCard>
					<CircleStatRow>
						<CircleStat
							label="Avg Speed"
							value={performance.avgSpeed}
							maxValue={3600}
							unit="s"
							reverse={true}
							description="Average time taken to answer a question"
						/>
						<CircleStat
							label="Accuracy"
							value={performance.accuracy * 100}
							maxValue={100}
							unit="%"
							description="Percentage of correct answers out of total attempts"
						/>
						<CircleStat
							label="Consistency"
							value={performance.consistency * 100}
							maxValue={100}
							unit="%"
							description={`Measures how consistently you complete quizzes`}
						/>

					</CircleStatRow>
				</CircleStatCard>

				{/* ───── QUIZ RESULTS ───── */}
				<ResultsPanel>
					<ResultsHeader>
						<ResultsTitle>{t("profile.results")}</ResultsTitle>
					</ResultsHeader>

					<SearchBar>
						<SearchInput value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t("nav.search")} />
						<SearchIcon><Search size={18} /></SearchIcon>
					</SearchBar>

					<GridScroller>
						<QuizGrid>
							{filteredQuizzes.map((quiz) => (
								<QuizCard key={quiz.id} onClick={() => handleQuizClick(quiz)} title={quiz.title}>
									<QuizCardTop>
										<QuizCardTitle>{quiz.title}</QuizCardTitle>
										<MiniBadge><Trophy size={14} /></MiniBadge>
									</QuizCardTop>
									<QuizCardMeta>
										Attempts: {quiz.attempts} • Best: {quiz.bestScore}
									</QuizCardMeta>
								</QuizCard>
							))}
						</QuizGrid>
					</GridScroller>
				</ResultsPanel>
			</Content>
		</Main>
	);
}


const Main = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    background: var(--color-background);
`;

const Content = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-xl);
    gap: var(--spacing-l);
    width: 100%;
    max-width: var(--spacing-14xl);
    margin: 0 auto;
`;

const ContentHead = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--spacing-l);
`;

const TitleContainer = styled.div`
	display: flex;
	align-items: center;
	gap: var(--spacing-s);
`;

const Title = styled.h1`
	font-weight: 600;
	font-size: var(--font-size-4xl);
    font-family: "Poppins", sans-serif;
	line-height: 1;
`;

const CardBase = styled.div`
    background: var(--color-background-surface-1);
    border-radius: var(--border-radius-2xl);
    box-shadow: var(--box-shadow-xs);
`;

const ProfileCard = styled(CardBase)`
    padding: var(--spacing-xl);
`;

const Identity = styled.div`
    display: flex;
	align-items: center;
	gap: var(--spacing);
`;

const AvatarSkeleton = styled(Skeleton)`
    width: var(--spacing-4xl) !important;
    height: var(--spacing-4xl) !important;
    border-radius: var(--border-radius-xl);
`;

const AvatarWrapper = styled.div`
	width: var(--spacing-4xl);
	height: var(--spacing-4xl);
	border-radius: var(--border-radius-xl);
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
    box-shadow: var(--box-shadow-xs);
`;

const FallbackIcon = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--border-radius);
`;

const IdentityInfo = styled.div`
    display: flex;
	align-items: flex-start;
	flex-direction: column;
	gap: var(--spacing-s);
	width: 100%;
	flex:1;
`;

const ProfileName = styled.div`
    font-size: var(--font-size-l);
    color: var(--color-text);
    font-weight: 600;
    text-align: center;
`;

const ProfileRegister = styled.div`
    font-size: var(--font-size-s);
	color: var(--color-text-muted);
	opacity: 0.9;
    font-weight: 500;
`;

const StatsContainer = styled.div`
    display: flex;
	align-items: center;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-l);
    width: 100%;
`;

const StatList = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
	width: 50%;
	flex: 1;
`;

const StatRow = styled.div`
    display: flex;
    justify-content: space-between;
	padding: var(--spacing-l);
	border-radius: var(--border-radius);
    box-shadow: var(--box-shadow-xs);
    background-image: repeating-linear-gradient(
            -126deg,
            var(--color-background),
            var(--color-background) 5px,
            rgba(0,0,0,0) 5px,
            rgba(0,0,0,0) 10px
    );
`;

const StatLabel = styled.div`
    color: var(--color-text);
	font-size: var(--font-size);
	font-weight: 500;
`;

const StatValue = styled.div`
    color: var(--color-text);
    font-size: var(--font-size);
    font-weight: 500;
`;

const TopScoreContainer = styled.div`
    display: flex;
	align-items: center;
	justify-content: center;
    flex-direction: column;
    gap: var(--spacing-s);
    width: 50%;
    flex: 1;
`;

const TopScoreLabel = styled.p`
    font-weight: 600;
    font-size: var(--font-size-3xl);
    color: var(--color-text-muted);
`;

const TopScore = styled.p`
    font-family: "Orbitron", sans-serif;
    color: var(--color-primary-bg);
    font-size: var(--font-size-6xl);
    font-weight: 600;
`;

const TrophyRow = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: var(--spacing);
	gap: var(--spacing);
	width: 100%;
`;

const TrophyColumn = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--spacing);
	width: 12%;
`;

const TrophyCircle = styled.div`
	width: 56px;
	height: 56px;
	border-radius: var(--border-radius);
	background-color: var(--color-background);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: var(--box-shadow-xs);
`;

const TrophyCount = styled.div`
	font-weight: 500;
	font-size: var(--font-size);
	color: var(--color-text-muted);
`;

const CircleStatCard = styled(CardBase)`
    padding: var(--spacing-xl) var(--spacing-2xl);
`;

const CircleStatRow = styled.div`
	display: flex;
	justify-content: space-around;
    margin: var(--spacing) 0;
`;

const CircleStatWrap = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 33.33%;
	padding: 0 var(--spacing-s);
	gap: var(--spacing);
`;

const CircleLabel = styled.div`
	font-weight: 600;
	font-size: var(--font-size-2xl);
	color: var(--color-text);
`;

const CircleDesc = styled.div`
    font-size: var(--font-size-s);
	line-height: 1.4;
    color: var(--color-text-muted);
	text-align: center;
`;

const ResultsPanel = styled(CardBase)`
    padding: 18px;
    display: flex;
    flex-direction: column;
`;

const ResultsHeader = styled.div`
    display: flex;
    justify-content: center;
`;

const ResultsTitle = styled.h1`
    font-size: 44px;
`;

const SearchBar = styled.div`
    margin: 12px auto;
    width: min(520px, 100%);
    position: relative;
`;

const SearchInput = styled.input`
    width: 100%;
    height: 40px;
    border-radius: 999px;
    padding: 0 44px 0 16px;
`;

const SearchIcon = styled.div`
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
`;

const GridScroller = styled.div`
    flex: 1;
    overflow: auto;
`;

const QuizGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
`;

const QuizCard = styled.button`
    height: 92px;
    border-radius: 14px;
    padding: 12px;
    cursor: pointer;
    text-align: left;
`;

const QuizCardTop = styled.div`
    display: flex;
    justify-content: space-between;
`;

const QuizCardTitle = styled.div`
    font-weight: 800;
`;

const QuizCardMeta = styled.div`
    margin-top: 8px;
    font-size: 12px;
    opacity: 0.7;
`;

const MiniBadge = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: grid;
    place-items: center;
`;
