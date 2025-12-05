import React, {useEffect, useState} from "react";
import styled, { keyframes } from "styled-components";
import { Crown } from "lucide-react";
import {applyScoreMultiplier} from "../../utils/score";

function AnimatedScore({ finalScore }) {
	const [score, setScore] = useState(0);

	useEffect(() => {
		let start = 0;
		const duration = 2000; // animation duration in ms
		const increment = finalScore / (duration / 16); // approx 60fps
		let animationFrame;

		const animate = () => {
			start += increment;
			if (start < finalScore) {
				setScore(Math.floor(start));
				animationFrame = requestAnimationFrame(animate);
			} else {
				setScore(finalScore);
			}
		};

		animationFrame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationFrame);
	}, [finalScore]);

	return <Score>{score}</Score>;
}

export default function LeaderboardPodium({ entries = [] }) {
	const first = entries.find((e) => e.rank === 1);
	const second = entries.find((e) => e.rank === 2);
	const third = entries.find((e) => e.rank === 3);

	const podiums = [
		{ position: 2, entry: second },
		{ position: 1, entry: first },
		{ position: 3, entry: third },
	];

	const crownColors = {
		1: "#FFD700",
		2: "#C0C0C0",
		3: "#CD7F32",
	};

	return (
		<PodiumContainer>
			{podiums.map((p) => (
				<PodiumColumn key={p.position} $position={p.position}>
					<PodiumCard $position={p.position}>
						{/* Crown */}
						<CustomCrown color={crownColors[p.position]} size={60} />

						{/* Avatar */}
						<Avatar $position={p.position}/>

						{/* Name */}
						<Name>{p.entry?.user_name ?? "_name_"}</Name>

						{/* Score */}
						<AnimatedScore finalScore={applyScoreMultiplier(p.entry?.score) ?? 0} />
					</PodiumCard>

					{/* Podium base with glowing number */}
					<PodiumBase $position={p.position}>
						<PodiumNumber $position={p.position}>{p.position}</PodiumNumber>
					</PodiumBase>
				</PodiumColumn>
			))}
		</PodiumContainer>
	);
}

const COLORS = {
	gold: "#FFD700",
	silver: "#C0C0C0",
	bronze: "#CD7F32",
};

const PodiumContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 24px;
    width: 100%;
    max-width: 1200px;
    padding: 0 0 var(--spacing-xl);
`;

const PodiumColumn = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    flex: 1;
`;

const podiumHeights = { 1: 220, 2: 170, 3: 140 };

const PodiumCard = styled.div`
    width: 100%;
    color: var(--color-text);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-s);
    z-index: 10;
	margin-bottom: var(--spacing-l);
`;

const CustomCrown = styled(Crown)`
    transform: rotate(10deg);
	position: relative;
	left: 10px;
`;

const glowAvatar = (color) => keyframes`
  0%, 100% { box-shadow: 0 0 8px ${color}, 0 0 16px ${color}; }
  50% { box-shadow: 0 0 16px ${color}, 0 0 32px ${color}; }
`;

const Avatar = styled.div`
    width: 140px;
    height: 140px;
    border-radius: var(--border-radius-2xl);
    background: rgba(255,255,255,0.2);
    border: 4px solid ${({ $position }) =>
            $position === 1 ? COLORS.gold :
                    $position === 2 ? COLORS.silver : COLORS.bronze};
    animation: ${({ $position }) => glowAvatar(
            $position === 1 ? COLORS.gold :
                    $position === 2 ? COLORS.silver : COLORS.bronze
    )} 1.5s ease-in-out infinite;
	margin-top: var(--spacing);
`;

const glow = keyframes`
    0%, 100% { text-shadow: 0 0 4px #fff, 0 0 8px #fff, 0 0 12px #fff; }
    50% { text-shadow: 0 0 8px #fff, 0 0 16px #fff, 0 0 24px #fff; }
`;

const PodiumBase = styled.div`
    width: 100%;
    height: ${({ $position }) => podiumHeights[$position]}px;
    background: var(--color-background-surface-2);
    border-radius: var(--border-radius);
    border: 4px solid
    	${({ $position }) =>
            $position === 1
                    ? COLORS.gold
                    : $position === 2
                            ? COLORS.silver
                            : COLORS.bronze};
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const PodiumNumber = styled.div`
    font-size: var(--font-size-7xl);
    font-weight: 600;
    color: ${({ $position }) =>
            $position === 1 ? COLORS.gold :
                    $position === 2 ? COLORS.silver :
                            COLORS.bronze};
    //text-shadow: 0 0 6px #fff, 0 0 12px #fff;
    //animation: ${glow} 1.5s ease-in-out infinite;
`;

const Name = styled.div`
    font-size: var(--font-size-2xl);
    font-weight: 800;
    margin-top: var(--spacing-l);
    font-family: "Orbitron", sans-serif;
`;

const Score = styled.div`
    display: flex;
    align-items: center;
    font-size: var(--font-size-6xl);
    font-weight: 600;
    color: var(--color-primary-bg);
    font-family: "Orbitron", sans-serif;
    transform: rotate(2deg);
	margin-bottom: var(--spacing-s);
`;
