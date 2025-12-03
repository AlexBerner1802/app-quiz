import React from "react";
import styled from "styled-components";
import Button from "../../../components/ui/Button";


export default function ConfirmEndStep({ onCancel, onConfirm, saving }) {
	return (
		<EndCard>
			<p>Are you sure you want to finish the quiz?</p>
			<ButtonsRow>
				<Button onClick={onCancel} variant="secondary">Cancel</Button>
				<Button onClick={onConfirm} variant="primary" disabled={saving}>
					{saving ? "Saving..." : "Finish Quiz"}
				</Button>
			</ButtonsRow>
		</EndCard>
	);
}


const EndCard = styled.div`
	display:flex; 
	flex-direction:column; 
	justify-content:center; 
	align-items:center; 
	gap:var(--spacing); 
	text-align:center;
`;

const ButtonsRow = styled.div`
	display:flex; 
	gap: var(--spacing-s);
`;
