import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";
import ParticlesBackground from "../../../components/particules/ParticlesBackground";

export default function ConfirmEndStep({ onCancel, onConfirm, saving }) {
	return (
		<EndCard>
			<ParticlesBackground
				preset="confetti-rainbow"
				colors={["--color-primary-bg", "--color-primary-bg-hover", "--color-primary-bg-muted"]}
			/>
			<Content>
				<Title>You're Almost There!</Title>
				<Message>Ready to wrap up the quiz and see your results?</Message>
				<ButtonsRow>
					<Button onClick={onCancel} variant="secondary">Not Yet</Button>
					<Button onClick={onConfirm} variant="primary" disabled={saving}>
						{saving ? "Saving..." : "Finish Quiz"}
					</Button>
				</ButtonsRow>
			</Content>
		</EndCard>
	);
}

const EndCard = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
	flex: 1;
	width: 100%;
	height: 100%;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
	align-items: center;
	gap: var(--spacing);
    padding: var(--spacing-2xl);
	box-shadow: var(--box-shadow-l);
	border-radius: var(--border-radius);
	background-color: var(--color-background-surface-1);
	z-index: 2;
`;

const Title = styled.h2`
    margin: 0;
    font-size: var(--font-size-3xl);
    color: var(--color-primary-bg);
`;

const Message = styled.p`
	margin: 0 0 var(--spacing);
    font-size: var(--font-size-xl);
	color: var(--color-text);
	font-weight: 500;
`;

const ButtonsRow = styled.div`
	display: flex;
	gap: var(--spacing-s);
`;
