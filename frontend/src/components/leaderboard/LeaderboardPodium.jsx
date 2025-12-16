import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Crown } from "lucide-react";
import { applyScoreMultiplier } from "../../utils/score";
import Invader from "../icons/Invader";

/* ---------------- Animated Score ---------------- */

function AnimatedScore({ finalScore, scale, position }) {
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

	return <Score $scale={scale} $position={position}>{score}</Score>;
}

/* ---------------- Avatar Component ---------------- */

function Avatar({ src, name, position, scale }) {
	const [error, setError] = useState(false);

	const showFallback = !src || error;

	return (
		<AvatarWrapper $position={position} $scale={scale}>
			{!showFallback && (
				<AvatarImage
					src={src}
					alt={name}
					onError={() => setError(true)}
				/>
			)}

			{showFallback && (
				<AvatarFallback>
					<Invader size={80 * scale} color={"var(--color-input-placeholder)"} />
				</AvatarFallback>
			)}
		</AvatarWrapper>
	);
}

/* ---------------- Main Component ---------------- */

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
				<PodiumColumn key={p.position}>
					<PodiumCard $scale={size}>
						{/* Crown */}
						<CustomCrown
							color={crownColors[p.position]}
							size={60 * size}
							$scale={size}
						/>

						{/* Avatar */}
						<Avatar
							src={p.entry?.avatar_url}
							name={p.entry?.user_name}
							position={p.position}
							scale={size}
						/>

						{/* Name */}
						<Name $scale={size}>{p.entry?.user_name ?? "_name_"}</Name>

						{/* Score */}
						<AnimatedScore
							scale={size}
							position={p.position}
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

/* ---------------- Styles ---------------- */

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
    padding-bottom: ${({ $scale }) => 32 * $scale}px;
`;

const PodiumColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
`;

const PodiumCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${({ $scale }) => 8 * $scale}px;
    margin-bottom: ${({ $scale }) => 24 * $scale}px;
    z-index: 10;
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

const AvatarWrapper = styled.div`
    width: ${({ $scale }) => 140 * $scale}px;
    height: ${({ $scale }) => 140 * $scale}px;
    border-radius: ${({ $scale }) => 20 * $scale}px;
    position: relative;
    overflow: hidden;

    background: var(--color-background-surface-3);
/*
    border: ${({ $scale }) => 4 * $scale}px solid
		${({ $position }) =>
				$position === 1
						? COLORS.gold
						: $position === 2
								? COLORS.silver
								: COLORS.bronze};
*/
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

const AvatarImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const AvatarFallback = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--color-text-muted);
    background: radial-gradient(
            circle at top,
            var(--color-background-surface-4),
            var(--color-background-surface-2)
    );
`;

const PodiumBase = styled.div`
    width: 100%;
    height: ${({ $position, $scale }) =>
            ({ 1: 220, 2: 170, 3: 140 }[$position]) * $scale}px;

    background: ${({ $position }) => {
        const color =
                $position === 1
                        ? COLORS.gold
                        : $position === 2
                                ? COLORS.silver
                                : COLORS.bronze;
        return `linear-gradient(to bottom, ${color} 0%, ${color}33 80%, transparent 100%)`;
    }};

    border-radius: ${({ $scale }) => 12 * $scale}px;
    display: flex;
    justify-content: center;
	padding: var(--spacing-xl)
`;


const PodiumNumber = styled.div`
    font-size: ${({ $scale }) => 56 * $scale}px;
    font-weight: 600;
	color: #fff;
`;

const Name = styled.div`
    font-size: ${({ $scale }) => 24 * $scale}px;
    font-weight: 800;
    margin-top: ${({ $scale }) => 24 * $scale}px;
    font-family: "Orbitron", sans-serif;
	color: var(--color-text-muted);
`;

const Score = styled.div`
    font-size: ${({ $scale }) => 48 * $scale}px;
    font-weight: 600;
    font-family: "Orbitron", sans-serif;
    transform: rotate(2deg);
    margin-bottom: ${({ $scale }) => 12 * $scale}px;
    color: ${({ $position }) =>
            $position === 1
                    ? COLORS.gold
                    : $position === 2
                            ? COLORS.silver
                            : COLORS.bronze};
`;
