import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Crown } from "lucide-react";
import { applyScoreMultiplier } from "../../utils/score";
import Invader from "../icons/Invader";


/* ---------------- Animated Score ---------------- */

function AnimatedScore({ finalScore, position, color }) {
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

	return <Score $position={position} $color={color}>{score}</Score>;
}

/* ---------------- Avatar Component ---------------- */

function Avatar({ src, name, color }) {
	const [error, setError] = useState(false);
	const showFallback = !src || error;

	return (
		<AvatarWrapper $color={color}>
			{!showFallback && (
				<AvatarImage
					src={src}
					alt={name}
					onError={() => setError(true)}
				/>
			)}
			{showFallback && (
				<AvatarFallback>
					<Invader size={40} color={"var(--color-input-placeholder"} />
				</AvatarFallback>
			)}
		</AvatarWrapper>
	);
}

/* ---------------- Main Component ---------------- */

export default function LeaderboardPodium({ entries = [] }) {
	const first = entries.find((e) => e.rank === 1);
	const second = entries.find((e) => e.rank === 2);
	const third = entries.find((e) => e.rank === 3);

	const podiums = [
		{ position: 1, entry: first },
		{ position: 2, entry: second },
		{ position: 3, entry: third },
	];

	const crownColors = {
		1: "var(--first-place)",
		2: "var(--second-place)",
		3: "var(--third-place)",
	};

	const randomTries = () => Math.floor(Math.random() * 15) + 5;

	const randomTime = () => {
		const hours = Math.floor(Math.random() * 3);
		const minutes = Math.floor(Math.random() * 60);
		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
	};

	return (
		<PodiumContainer>
			{podiums.map((p) => (
				<PodiumColumn key={p.position}>
					<PodiumCard $position={p.position}
								$color={crownColors[p.position]}>

						<PodiumCardHead>
							{/* Avatar */}
							<Avatar
								src={p.entry?.avatar_url}
								name={p.entry?.user_name}
								color={crownColors[p.position]}
							/>

							{/* Name */}
							<Name>{p.entry?.user_name ?? "_name_"}</Name>

							{/* Crown */}
							<CrownContainer>
								<CustomCrown
									color={crownColors[p.position]}
									size={24}
								/>
							</CrownContainer>
						</PodiumCardHead>

						<StatsRow>
							<Stat>
								<StatLabel>Score</StatLabel>
								<StatValue>
									<AnimatedScore
										position={p.position}
										color={crownColors[p.position]}
										finalScore={applyScoreMultiplier(p.entry?.score) ?? 0}
									/>
								</StatValue>
							</Stat>

							<Stat>
								<StatLabel>Temps</StatLabel>
								<StatValue $color={crownColors[p.position]}>{randomTime()}</StatValue>
							</Stat>

							<Stat>
								<StatLabel>Essais</StatLabel>
								<StatValue $color={crownColors[p.position]}>{randomTries()}</StatValue>
							</Stat>
						</StatsRow>
					</PodiumCard>

				</PodiumColumn>
			))}
		</PodiumContainer>
	);
}

/* ---------------- Styles ---------------- */

const PodiumContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: var(--spacing);
    width: 100%;
    padding-bottom: 32px;
`;

const PodiumColumn = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
`;

const podiumGradient = (position) => {
	switch (position) {
		case 1:
			return `linear-gradient(
				to bottom,
				var(--color-background-surface-1),
				rgba(255, 215, 0, 0.18)
			  )`;
		case 2:
			return `linear-gradient(
				to bottom,
				var(--color-background-surface-1),
				rgba(192, 192, 192, 0.18)
			  )`;
		case 3:
			return `linear-gradient(
				to bottom,
				var(--color-background-surface-1),
				rgba(205, 127, 50, 0.18)
			  )`;
		default:
			return `var(--color-background-surface-1)`;
	}
};

const PodiumCard = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    z-index: 10;
    width: 100%;
    background: ${({ $position }) => podiumGradient($position)};
    border-radius: var(--border-radius-2xl);
    padding: var(--spacing-xl);
    box-shadow: var(--box-shadow-xs);
    position: relative;

    &::after {
        content: "";
        position: absolute;
        bottom: -1PX;
        left: 50%;
        transform: translateX(-50%);
        width: 38%;
        height: 3px;
        background-color: ${({ $color }) => $color};
        border-radius: 2px;
    }
`;


const PodiumCardHead = styled.div`
    display: flex;
    align-items: center;
    gap: var(--spacing);
	width: 100%;
`;

const AvatarWrapper = styled.div`
    width: var(--spacing-3xl);
    height: var(--spacing-3xl);
    position: relative;
    border-radius: var(--border-radius);
    border: 2px solid ${({ $color }) => $color};
    box-sizing: border-box;
    box-shadow: var(--box-shadow-xs);
`;

const AvatarImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--border-radius);
    background: var(--color-background-surface-3);
`;

const AvatarFallback = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    color: var(--color-text-muted);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
`;

const Name = styled.div`
    font-size: var(--font-size-l);
    font-weight: 700;
    font-family: "Orbitron", sans-serif;
	color: var(--color-text-muted);
	flex: 1;
	width: 100%;
`;

const CustomCrown = styled(Crown)`
    position: relative;
`;

const CrownContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
    border-radius: var(--border-radius-full);
	background-color: var(--color-background-muted);
    padding: var(--spacing);
	box-shadow: var(--box-shadow-xs);
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs);
  width: 100%;
  margin-top: var(--spacing-l);
  text-align: center;
`;

const Stat = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
`;

const StatValue = styled.div`
    font-size: var(--font-size-l);
	font-weight: 500;
	font-family: "Orbitron", sans-serif;
    color: ${({ $color }) => $color || 'var(--color-text)'};
`;

const StatLabel = styled.div`
	font-size: var(--font-size-xs);
    font-weight: 500;
	text-transform: uppercase;
	color: var(--color-text-muted);
`;

const Score = styled.div`
    font-weight: 600;
	font-size: var(--font-size-xl);
    font-family: "Orbitron", sans-serif;
    color: ${({ $color }) => $color};
`;
