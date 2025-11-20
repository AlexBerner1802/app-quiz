import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

export default function UnsavedChangesGuard({ when = false }) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const [nextLocation, setNextLocation] = useState(null);

	// Handle browser refresh / tab close
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			if (!when) return;
			e.preventDefault();
			e.returnValue = t("dialogs.unsaved.text") || "You have unsaved changes!";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [when, t]);

	// Handle internal navigation
	useEffect(() => {
		if (!when) return;

		const handleClick = (e) => {
			const anchor = e.target.closest("a");
			if (!anchor || anchor.target === "_blank") return;
			e.preventDefault();
			setNextLocation(anchor.href);
			setOpen(true);
		};

		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, [when]);

	const stay = () => {
		setOpen(false);
		setNextLocation(null);
	};

	const leave = () => {
		setOpen(false);
		if (nextLocation) {
			window.location.href = nextLocation; // navigate externally
		}
	};

	if (!open) return null;

	return (
		<Overlay>
			<Box>
				<Title>{t("dialogs.unsaved.title") || "Unsaved Changes"}</Title>
				<Text>{t("dialogs.unsaved.text") || "You have unsaved changes. Are you sure you want to leave?"}</Text>
				<Row>
					<BtnSecondary onClick={stay}>{t("dialogs.unsaved.stay") || "Stay"}</BtnSecondary>
					<BtnPrimary onClick={leave}>{t("dialogs.unsaved.leave") || "Leave"}</BtnPrimary>
				</Row>
			</Box>
		</Overlay>
	);
}


const Overlay = styled.div`
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
`;
const Box = styled.div`
    padding: 20px 24px;
    border-radius: 10px;
    max-width: 360px;
    width: 100%;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    background-color: var(--color-background);
`;
const Title = styled.h2`
    margin: 0 0 8px;
    font-size: 18px;
`;
const Text = styled.p`
    margin: 0 0 16px;
    color: #555;
`;
const Row = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 8px;
`;
const BtnSecondary = styled.button`
    padding: 8px 12px;
    background-color: var(--color-primary-bg);
    border: none;
    border-radius: 6px;
    cursor: pointer;
`;
const BtnPrimary = styled.button`
    background: #ef4444;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    &:hover {
        background: #dc2626;
    }
`;
