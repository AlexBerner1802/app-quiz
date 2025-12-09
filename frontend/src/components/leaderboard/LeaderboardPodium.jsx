import React, {useEffect, useState} from "react";
import styled, { keyframes } from "styled-components";
import { Crown } from "lucide-react";
import {applyScoreMultiplier} from "../../utils/score";

function AnimatedScore({ finalScore, scale }) {
	const [score, setScore] = useState(0);

	useEffect(() => {
		let start = 0;
		const duration = 2000;
		const increment = finalScore / (duration / 16);
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

	return <Score $scale={scale}>{score}</Score>;
}

export default function LeaderboardPodium({ entries = [], size = 1 }) {

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
		<PodiumContainer $scale={size}>
			{podiums.map((p) => (
				<PodiumColumn key={p.position} $position={p.position} $scale={size}>
					<PodiumCard $position={p.position} $scale={size}>
						
						{/* Crown */}
						<CustomCrown
							color={crownColors[p.position]}
							size={60 * size}
							$scale={size}
						/>

						{/* Avatar */}
						<Avatar $position={p.position} $scale={size} />

						{/* Name */}
						<Name $scale={size}>{p.entry?.user_name ?? "_name_"}</Name>

						{/* Score */}
						<AnimatedScore
							scale={size}
							finalScore={applyScoreMultiplier(p.entry?.score) ?? 0}
						/>
					</PodiumCard>

					{/* Base */}
					<PodiumBase $position={p.position} $scale={size}>
						<PodiumNumber $position={p.position} $scale={size}>
							{p.position}
						</PodiumNumber>
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
    gap: ${({ $scale }) => 24 * $scale}px;
    width: 100%;
    max-width: ${({ $scale }) => 1200 * $scale}px;
    padding: 0 0 ${({ $scale }) => 32 * $scale}px;
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
    gap: ${({ $scale }) => 8 * $scale}px;
    z-index: 10;
	margin-bottom: ${({ $scale }) => 24 * $scale}px;
`;

const CustomCrown = styled(Crown)`
    transform: rotate(10deg);
	position: relative;
	left: ${({ $scale }) => 10 * $scale}px;
`;

const glowAvatar = (color) => keyframes`
  0%, 100% { box-shadow: 0 0 8px ${color}, 0 0 16px ${color}; }
  50% { box-shadow: 0 0 16px ${color}, 0 0 32px ${color}; }
`;

const Avatar = styled.div`
    width: ${({ $scale }) => 140 * $scale}px;
    height: ${({ $scale }) => 140 * $scale}px;
    border-radius: ${({ $scale }) => 20 * $scale}px;
    background: rgba(255,255,255,0.2);
    border: ${({ $scale }) => 4 * $scale}px solid
        ${({ $position }) =>
            $position === 1
                ? COLORS.gold
                : $position === 2
                ? COLORS.silver
                : COLORS.bronze};
    animation: ${({ $position }) =>
            glowAvatar(
                $position === 1
                    ? COLORS.gold
                    : $position === 2
                    ? COLORS.silver
                    : COLORS.bronze
            )}
        1.5s ease-in-out infinite;
	margin-top: ${({ $scale }) => 16 * $scale}px;
`;

const PodiumBase = styled.div`
    width: 100%;
    height: ${({ $position, $scale }) => podiumHeights[$position] * $scale}px;
    background: var(--color-background-surface-2);
    border-radius: ${({ $scale }) => 12 * $scale}px;
    border: ${({ $scale }) => 4 * $scale}px solid
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
    font-size: ${({ $scale }) => 56 * $scale}px;
    font-weight: 600;
    color: ${({ $position }) =>
            $position === 1
                ? COLORS.gold
                : $position === 2
                ? COLORS.silver
                : COLORS.bronze};
`;

const Name = styled.div`
    font-size: ${({ $scale }) => 24 * $scale}px;
    font-weight: 800;
    margin-top: ${({ $scale }) => 24 * $scale}px;
    font-family: "Orbitron", sans-serif;
`;

const Score = styled.div`
    display: flex;
    align-items: center;
    font-size: ${({ $scale }) => 48 * $scale}px;
    font-weight: 600;
    color: var(--color-primary-bg);
    font-family: "Orbitron", sans-serif;
    transform: rotate(2deg);
	margin-bottom: ${({ $scale }) => 12 * $scale}px;
`;
