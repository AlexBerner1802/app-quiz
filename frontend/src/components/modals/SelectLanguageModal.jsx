// src/context/modal/modals/SelectLanguageModal.jsx
import React from "react";
import { Dialog, Overlay } from "../../context/modal/ModalProvider";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Button from "../ui/Button";

export default function SelectLanguageModal({ currentLangs = [], onAdd, onClose }) {
	const { i18n, t } = useTranslation();

	// All supported languages
	const allLangs = Object.entries(i18n.options.resources || {});

	return (
		<Overlay onClick={onClose}>
			<Dialog onClick={(e) => e.stopPropagation()}>
				<h3>{t("quiz.add_language") || "Select Language"}</h3>
				<LangList>
					{allLangs.map(([code, res]) => {
						const isUsed = currentLangs.includes(code);
						return (
							<LangItem
								key={code}
								onClick={() => !isUsed && (onAdd(code), onClose())}
								disabled={isUsed}
								$used={isUsed}
							>
								{t("lang."+code)}
								{isUsed && " (Added)"}
							</LangItem>
						);
					})}
				</LangList>
				<Actions>
					<Button variant={"secondary"}
							onClick={onClose}>
						{t("common.cancel") || "Cancel"}
					</Button>
				</Actions>
			</Dialog>
		</Overlay>
	);
}


/* Styled Components */
const LangList = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin: var(--spacing-s) 0;
    overflow-y: auto;
    flex: 1;           /* take remaining vertical space */
    min-height: 100px; /* optional */
`;

const LangItem = styled.button`
	display: flex;
	justify-content: space-between;
	padding: var(--spacing);
	border: 1px solid var(--color-border);
	border-radius: var(--border-radius);
	background-color: var(--color-surface);
	transition: all .2s ease;
	cursor: pointer;
	text-align: left;
	font-size: var(--font-size);
	
	&:hover {
		background-color: var(--color-primary-bg-hover);
        border: 1px solid var(--color-primary-bg);
	}
	
	&:disabled {
		cursor: default;
		pointer-events: none;
    }
`;

const Actions = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
    margin-top: var(--spacing-s);
`;

