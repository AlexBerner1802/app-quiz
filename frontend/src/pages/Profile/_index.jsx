import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Search, User, Trophy } from "lucide-react";

import Header from "../../components/layout/Header";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";

import { useDrawer } from "../../context/drawer";
import { QuizResultsDrawer } from "../../components/drawers/QuizResultsDrawer";

function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
    if (m > 0) return `${m}m ${String(r).padStart(2, "0")}s`;
    return `${r}s`;
}


export default function ProfilePage() {
    const { t } = useTranslation();
    const { openDrawer } = useDrawer();
    
    const [user, setUser] = useState({
        name: "",
        role: "",
        email: "",
        avatarUrl: null,
    });

    const [stats, setStats] = useState({
        totalAttempts: 0,
        true: 0,
        false: 0,
        totalPoints: 0,
        totalTimeSec: 0,
    });
    const [quizzes, setQuizzes] = useState([]);



    const [searchText, setSearchText] = useState("");

    const { id_user } = useParams();

    useEffect(() => {
        if (!id_user) return;

        (async () => {
            try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id_user}/profile`)
            if (!res.ok) throw new Error("Failed to load profile");
            const data = await res.json();

            setUser((prev) => ({
                ...prev,
                name: data.user?.name ?? prev.name,
                role: data.user?.roleName ?? data.user?.id_role ?? prev.name,
                email: data.user?.username ?? prev.username,
                avatarUrl: data.user?.avatar ?? prev.avatarUrl,
            }));

            setStats((prev) => ({
                ...prev,
                ...data.stats,
            }));

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

    const handleQuizClick = (quiz) => {
        openDrawer("quizUserAttempts", {
            quiz,
            id_user,
            userDisplayName: user?.name ?? user?.username ?? "Me",
        });


    return (
        <Shell>
            <FaviconTitle icon={faviconUrl} title={t("pages.accountPage")} />
            
            <Main>
                <Header 
                    title={t("profile.title")}
                    icon={<User size={20} />}
                    actions={
                        <ToggleThemeSwitch/>
                    }
                />
                <Content>
                    <ProfileCard>
                        <ProfileHeader>
                        </ProfileHeader>
                        <AvatarWrap>
                            {user.avatarUrl ? (
                                <AvatarImg src={user.avatarUrl} alt="avatar" />
                            ) : (
                                <AvatarFallback>
                                <User size={42} />
                                </AvatarFallback>
                            )}
                        </AvatarWrap>

                        <ProfileName>{user.name}</ProfileName>
                        <ProfileMeta>{user.role}</ProfileMeta>
                        <ProfileMeta>{user.email}</ProfileMeta>

                        <Divider />

                        <SectionTitle>{t("profile.stats")}</SectionTitle>

                        <StatList>
                        <StatRow>
                            <StatLabel>{t("profile.totalAttempts")}</StatLabel>
                            <StatValue>{stats?.totalAttempts ?? 0}</StatValue>
                        </StatRow>

                        <StatRow>
                            <StatLabel>{t("profile.true")} / {t("profile.false")}</StatLabel>
                            <StatValue>{stats ? `${stats.true} / ${stats.false}` : "0 / 0"}</StatValue>
                        </StatRow>

                        <StatRow>
                            <StatLabel>{t("profile.totalPoints")}</StatLabel>
                            <StatValue>{stats?.totalPoints ?? 0}</StatValue>
                        </StatRow>

                        <StatRow>
                            <StatLabel>{t("profile.totalTime")}</StatLabel>
                            <StatValue>{formatTime(stats?.totalTimeSec ?? 0)}</StatValue>
                        </StatRow>
                        </StatList>
                     </ProfileCard>

                     <ResultsPanel>
                        <ResultsHeader>
                        <ResultsTitle>{t("profile.results")}</ResultsTitle>
                        </ResultsHeader>

                        <SearchBar>
                        <SearchInput
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder={t("nav.search")}
                        />
                        <SearchIcon>
                            <Search size={18} />
                        </SearchIcon>
                        </SearchBar>

                        <GridScroller>
                        <QuizGrid>
                            {filteredQuizzes.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    onClick={() => handleQuizClick(quiz)}
                                    title={quiz.title}
                                >
                                <QuizCardTop>
                                <QuizCardTitle>{quiz.title}</QuizCardTitle>
                                <MiniBadge title={t("profile.openResults")}>
                                    <Trophy size={14} />
                                </MiniBadge>
                                </QuizCardTop>

                                <QuizCardMeta>
                                {t("leaderboard.attempts")}: {quiz.attempts} •{" "}
                                {t("profile.best")}: {quiz.bestScore}
                                </QuizCardMeta>
                            </QuizCard>
                            ))}
                        </QuizGrid>
                        </GridScroller>
                    </ResultsPanel>                    
                </Content>
            </Main>
        </Shell>
    );
}
}


const Shell = styled.div`
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
`;

const Main = styled.main`
  flex: 1;
  padding: 18px 22px;
`;

const Content = styled.div`
  max-width: 1120px;
  margin: 16px auto 0;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 22px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const CardBase = styled.div`
  background: var(--color-background-alt);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
`;

const ProfileCard = styled(CardBase)`
  padding: 18px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const AvatarWrap = styled.div`
  display: grid;
  place-items: center;
  margin: 10px 0 6px;
`;

const AvatarImg = styled.img`
  width: 118px;
  height: 118px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid rgba(0, 0, 0, 0.06);
`;

const AvatarFallback = styled.div`
  width: 118px;
  height: 118px;
  border-radius: 999px;
  background: var(--color-background-muted);
  color: var(--color-text);
  display: grid;
  place-items: center;
  position: relative;
`;

const ProfileName = styled.div`
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  margin-top: 8px;
  color: var(--color-text);
`;

const ProfileMeta = styled.div`
  text-align: center;
  opacity: 0.75;
  margin-top: 4px;
  color: var(--color-text);
`;

const Divider = styled.div`
  height: 1px;
  background-color: var(--color-background-surface-5);
  margin: 16px 0;
`;

const SectionTitle = styled.div`
  font-weight: 800;
  letter-spacing: 0.04em;
  opacity: 0.85;
  margin-bottom: 10px;
  color: var(--color-text);
`;

const StatList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--color-text);
`;

const StatRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text);
`;

const StatLabel = styled.div`
  opacity: 0.75;
  color: var(--color-text-alt);
`;

const StatValue = styled.div`
  font-weight: 700;
  opacity: 0.9;
  color: var(--color-text);
`;

const ResultsPanel = styled(CardBase)`
  padding: 18px;
  display: flex;
  flex-direction: column;
  min-height: 520px;
`;

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ResultsTitle = styled.h1`
  margin: 0;
  font-size: 44px;
  letter-spacing: 0.02em;
`;

const SearchBar = styled.div`
  margin: 12px auto 14px;
  width: min(520px, 100%);
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 0 44px 0 16px;
  outline: none;
  background: var(--color-input-background);
  color: var(--color-text);

  &:focus {
    border-color: rgba(0, 0, 0, 0.18);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.65;
  pointer-events: none;
  color: var(--color-text);
`;

const GridScroller = styled.div`
  flex: 1;
  overflow: auto;
  padding-right: 6px;

  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 999px;
  }
`;

const QuizGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 6px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const QuizCard = styled.button`
  height: 92px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background-color: var(--color-background-surface-4);
  cursor: pointer;
  text-align: left;
  padding: 12px 12px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
    background-color: var(--color-background-surface-5);
  }
`;

const QuizCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const QuizCardTitle = styled.div`
  font-weight: 800;
  opacity: 0.92;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
`;

const QuizCardMeta = styled.div`
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
  color: var(--color-text);
`;

const MiniBadge = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.06);
  display: grid;
  place-items: center;
  color: var(--color-text);
`;