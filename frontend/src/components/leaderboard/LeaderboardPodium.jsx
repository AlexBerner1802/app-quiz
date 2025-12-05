import React from "react";
import styled from "styled-components";
import { Timer, Star, Trophy, PartyPopper, Award } from "lucide-react";

function formatTime(seconds) {
	if (seconds == null || isNaN(seconds)) return "_time_";
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LeaderboardPodium({ entries = [] }) {
	const first = entries.find((e) => e.rank === 1);
	const second = entries.find((e) => e.rank === 2);
	const third = entries.find((e) => e.rank === 3);

	return (
		<PodiumGrid>
			<CardWrapper>
				<PodiumCard $position="silver">
                    <QuizName>Quiz : <strong>{second?.quizName || "_quiz_"}</strong></QuizName>
					<Rank><PartyPopper size="35"/> #2</Rank>
					<Name>{second?.userName || "_name_"}</Name>

					<StatsRow>
						<span><Timer size="15"/> {second ? formatTime(second.timeSeconds) : "_"}</span>
						<Separator>·</Separator>
						<span><Star size="15"/> {second?.score ?? "_"}</span>
						<Separator>·</Separator>
						<Attempts><strong>{second?.attempts ?? "_"}</strong> essais</Attempts>
					</StatsRow>
				</PodiumCard>
			</CardWrapper>

			<CardWrapper>
				<PodiumCard $position="gold">
                    <QuizName>Quiz : <strong>{first?.quizName || "_quiz_"}</strong></QuizName>
					<Rank><Trophy size="35"/> #1</Rank>
					<Name>{first?.userName || "_name_"}</Name>

					<StatsRow>
						<span><Timer size="15"/> {first ? formatTime(first.timeSeconds) : "_"}</span>
						<Separator>·</Separator>
						<span><Star size="15"/> {first?.score ?? "_"}</span>
						<Separator>·</Separator>
						<Attempts><strong>{first?.attempts ?? "_"}</strong> essais</Attempts>
					</StatsRow>
				</PodiumCard>
			</CardWrapper>

			<CardWrapper>
				<PodiumCard $position="bronze">
                    <QuizName>Quiz : <strong>{third?.quizName || "_quiz_"}</strong></QuizName>
					<Rank><Award size="35"/> #3</Rank>
					<Name>{third?.userName || "_name_"}</Name>

					<StatsRow>
						<span><Timer size="15"/> {third ? formatTime(third.timeSeconds) : "_"}</span>
						<Separator>·</Separator>
						<span><Star size="15"/> {third?.score ?? "_"}</span>
						<Separator>·</Separator>
						<Attempts><strong>{third?.attempts ?? "_"}</strong> essais</Attempts>
					</StatsRow>
				</PodiumCard>
			</CardWrapper>
		</PodiumGrid>
	);
}

const COLORS = {
	gold: {
		bg: "rgba(255, 215, 0, 0.7)",
		border: "2px solid rgba(255,215,0,0.9)",
	},
	silver: {
		bg: "rgba(192, 192, 192, 0.7)",
		border: "2px solid rgba(220,220,220,0.9)",
	},
	bronze: {
		bg: "rgba(205, 127, 50, 0.7)",
		border: "2px solid rgba(205,127,50,0.9)",
	},
};

const PodiumGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: var(--spacing-l);
	width: 100%;
	max-width: 900px;
`;

const CardWrapper = styled.div`
	display: flex;
	justify-content: center;
`;

const PodiumCard = styled.div`
	width: 100%;
	max-width: 260px;
	height: 150px;
	padding: 16px;

	border-radius: var(--border-radius);

	background-color: ${({ $position }) => COLORS[$position].bg};
	border: ${({ $position }) => COLORS[$position].border};

	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	text-align: center;
	color: var(--color-text-alt);
`;

const Rank = styled.div`
	font-size: 32px;
	font-weight: 700;
	margin-bottom: 4px;
`;

const Name = styled.div`
	font-size: 15px;
	font-weight: 600;
	margin-bottom: 4px;
`;

const StatsRow = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
`;

const Separator = styled.span`
	color: var(--color-text-muted);
`;

const Attempts = styled.span`
	color: var(--color-text);
`;

const QuizName = styled.div`
    font-size: 18px;
`;