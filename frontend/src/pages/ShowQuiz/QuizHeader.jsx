import React from "react";
import styled from "styled-components";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";


export default function QuizHeader({ title, onBack }) {
	const navigate = useNavigate();

	const handleBack = () => {
		if (onBack) {
			const shouldLeave = onBack();
			if (!shouldLeave) return;
		}
		navigate(-1);
	};

	return (
		<Header>
			<Button onClick={handleBack} variant="ghost">
				<ChevronLeft size={30} />
			</Button>

			<HeaderTop>
				<h1>{title}</h1>
			</HeaderTop>
		</Header>
	);
}



const Header = styled.header`
    display: flex;
    gap: var(--spacing);
	background-color: var(--color-background);
	padding: var(--spacing);
	border: 1px solid var(--color-border);
	align-items: center;
`;

const HeaderTop = styled.div`
    display: grid;
    gap: var(--spacing-2xs);
`;