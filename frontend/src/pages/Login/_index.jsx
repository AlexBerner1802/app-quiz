import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RafLogo from '../../assets/images/raflogo.png';
import loginBackground from '../../assets/images/login_background.jpg';
import styled from 'styled-components';
import {LogIn} from "lucide-react";
import { useAuth } from "../../context/auth";
import { useTranslation } from "react-i18next";
import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";
import LanguageSelector from "../../components/ui/LanguageSelector";
import Button from "../../components/ui/Button";
import breakpoints from "../../context/theme/breakpoints.js";
import {useMediaQuery} from "react-responsive";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";

function LoginPage() {

	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const isTablet = useMediaQuery({ query: `(max-width: ${breakpoints.tablet})` });
	const { isInitialized, login, user } = useAuth();


    // Update the dir attribute to know in which direction the text should be read (R -> L / L -> R)
    useEffect(() => {
        document.documentElement.dir = i18n.dir();
    }, [i18n.resolvedLanguage, i18n]);

	// Redirect the user on /home if he's already in the localStorage except if he's in the MSAL popup
	useEffect(() => {
		// If user is authenticated, *and* they came to /login manually (not from logout)
		if (isInitialized && user) {
			navigate("/home", { replace: true });
		}
	}, [isInitialized, user, navigate, location]);


	// Redirect to /home unless a error occurs (the error is translated)
	const handleLogin = async () => {
		try {
			await login();
			navigate('/home', { replace: true });
		} catch (error) {
			console.error(`${t("pages.login.error")}:`, error);
		}
	};


	if(!isInitialized || user) return;

	return (
		<>
            <FaviconTitle title={t("pages.loginPage")} iconHref={faviconUrl} />
                <Container $bg={loginBackground}>
                    <Content>
                        <LeftContent $background={loginBackground}>
                            <LogoDesktop src={RafLogo} alt={t("app.name")} />
                            <Copyrights>{t("login.copyright")}</Copyrights>
                        </LeftContent>

                        <RightContent>
                            <RightContentTop>
                                {
                                    isTablet && (<Logo src={RafLogo} alt={t("app.name")} />)
                                }
                                <ToggleThemeSwitch />
                                <LanguageSelector short align={"right"}/>
                            </RightContentTop>

                            <RightContentContent>
                                <Title>{t("app.name")}</Title>
                                <Subtitle>{t("login.description")}</Subtitle>
                                <Button onClick={handleLogin} style={{marginLeft: "auto"}}>
                                    <LogIn size={24} />
                                    {t("login.sign_in")}
                                </Button>
                            </RightContentContent>
                        </RightContent>
                    </Content>
                </Container>
		</>
	);
}

export default LoginPage;

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    background: var(--gradient-background);
        //background: url(${props => props.$bg}) no-repeat center;
    background-size: cover;
`;

const Content = styled.div`
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    padding: var(--spacing-s);
    border-radius: var(--border-radius-xl);
    width: var(--spacing-12xl);
    min-width: 320px;
    min-height: 600px;
    max-height: 90vh;
    gap: var(--spacing-s);
    background: var(--liquidglass-bg);
    backdrop-filter: var(--liquidglass-blur);
    -webkit-backdrop-filter: var(--liquidglass-blur);
    box-shadow: var(--liquidglass-shadow);

    @media (max-width: ${breakpoints.tablet}) {
        flex-direction: column;
        max-width: 470px;
    }

    @media (max-width: ${breakpoints.mobile}) {
        width: 100%;
        border-radius: 0;
        min-height: 100vh;
    }
`;

const LeftContent = styled.div`
    flex: 1;
    width: 50%;
    background: url(${props => props.$background}) center center / cover no-repeat;
    border-radius: var(--border-radius-l);
    padding: var(--spacing);
    position: relative;
    overflow: hidden;

    // gradient overlay
    &::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.8),
                rgba(0, 0, 0, 0.0)
        );
        border-radius: inherit;
        pointer-events: none;
    }

    @media (max-width: ${breakpoints.tablet}) {
        width: 100%;
        flex: 0;
        order: 1;
        background: transparent;

        & img {
            display: none;
        }

        & p {
            color: var(--color-text);
        }

        &::after {
            display: none;
        }
    }
`;

const LogoDesktop = styled.img`
    width: 60px;
    height: auto;
    object-fit: contain;
    position: absolute;
    top: var(--spacing-l);
    left: var(--spacing-l);
    z-index: 1;
`;

const Logo = styled.img`
    width: 50px;
    height: auto;
    object-fit: contain;
    position: absolute;
    top: var(--spacing);
    left: var(--spacing);
    z-index: 1;
`;

const Copyrights = styled.p`
    width:100%;
    position: absolute;
    bottom: var(--spacing);
    color: var(--gray-50);
    text-align: center;
    font-size: var(--font-size-s);
    left: 0;
    right: 0;
    z-index: 1;
`;

const RightContent = styled.div`
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;

    @media (max-width: ${breakpoints.tablet}) {
        width: 100%;
        flex: 1;
    }
`;

const RightContentContent = styled.div`
    width: 100%;
    padding: var(--spacing-3xl);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: relative;
    flex: 1;

    @media (max-width: ${breakpoints.tablet}) {
        padding: var(--spacing-xl);
    }
`;

const Title = styled.h1`
    width: 100%;
    font-size: var(--font-size-4xl);
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 var(--spacing-l);
`;

const Subtitle = styled.p`
    width: 100%;
    font-weight: 400;
    color: var(--color-text);
    font-size: var(--font-size);
    line-height: var(--line-height-l);
    margin-bottom: var(--spacing-xl);
`;

const RightContentTop = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    bottom: 0;
    right: 0;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs);
`;