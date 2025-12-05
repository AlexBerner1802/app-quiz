// src/components/layout/AppLayout.jsx

import React, { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { Award, Settings as SettingsIcon, Search, LogOut, FlaskConical, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import MyLogo from "../../assets/images/raflogo.png";
import {useAuth} from "../../context/auth";


export default function AppLayout({ children }) {
	const { t } = useTranslation();
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const { logout } = useAuth();

	const user = useMemo(() => {
		try {
			const stored = localStorage.getItem("user");
			return stored ? JSON.parse(stored) : null;
		} catch {
			return null;
		}
	}, []);

	const handleLogoutClick = () => setShowLogoutModal(true);

	const confirmLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error(`Error logging out:`, error);
		}
	};

	const itemsTop = useMemo(() => ([
		{ key: "quiz",    title: t("nav.quiz"),    icon: <FlaskConical size={24} />, to: "/home" },
		{ key: "results", title: t("nav.results"), icon: <Award size={24} />,        to: "/results" },
		{ key: "search",  title: t("nav.search"),  icon: <Search size={24} />,       to: "/search" },
	]), [t]);

	const itemsBottom = useMemo(() => ([
		{ key: "content",  title: t("nav.content"),  icon: <Layers size={24} />,       to: "/content" },
		{ key: "settings", title: t("nav.settings"), icon: <SettingsIcon size={24} />, to: "/settings" },
		{ key: "logout",   title: t("nav.logout"),   icon: <LogOut size={24} color="#ef4444" />, onClick: handleLogoutClick },
	]), [t]);

	const avatarText =
		user && (user.username || user.name || user.localAccountId)
			? (user.username?.slice(0, 2) || "AB").toUpperCase()
			: "AB";

	return (
		<>
			<Container>
				<Sidebar
					logoSrc={MyLogo}
					logoAlt="Rafisa"
					itemsTop={itemsTop}
					itemsBottom={itemsBottom}
					avatarText={avatarText}
				/>
				<PageArea>{children}</PageArea>
			</Container>

			{showLogoutModal && (
				<ModalOverlay>
					<ModalBox>
						<ModalTitle>{t("modals.logout.title")}</ModalTitle>
						<ModalText>{t("modals.logout.text")}</ModalText>
						<ModalActions>
							<CancelButton onClick={() => setShowLogoutModal(false)}>{t("modals.logout.cancel")}</CancelButton>
							<ConfirmButton onClick={confirmLogout}>{t("modals.logout.confirm")}</ConfirmButton>
						</ModalActions>
					</ModalBox>
				</ModalOverlay>
			)}
		</>
	);
}

const Container = styled.div`
    display: flex;
    height: 100vh;
    width: 100vw;
    background: #fff;
    color: #333;
    font-family: Arial, sans-serif;
`;
const PageArea = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: auto;
`;

const ModalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
`;
const ModalBox = styled.div`
    padding: 20px 24px;
    border-radius: 10px;
    max-width: 360px;
    width: 100%;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    background-color: var(--color-background);
`;
const ModalTitle = styled.h2`
    margin: 0 0 8px;
    font-size: 18px;
`;
const ModalText = styled.p`
    margin: 0 0 16px;
    color: #555;
`;
const ModalActions = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 8px;
`;
const CancelButton = styled.button`
    padding: 8px 12px;
    background-color: var(--color-primary-bg);
    border: none;
    border-radius: 6px;
    cursor: pointer;
`;
const ConfirmButton = styled.button`
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
