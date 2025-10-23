import ToggleThemeSwitch from "../../components/ui/ToggleThemeSwitch";
import styled from "styled-components";
import { Settings } from "lucide-react"
import { useTranslation } from "react-i18next";
import LanguageSelector from "../../components/ui/LanguageSelector";
import Header from "../../components/layout/Header";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";

export default function SettingsPage() {
    // Translation function
    const { t } = useTranslation();
    
  return (
    <>
		<FaviconTitle title={t("pages.settingsPage")} iconHref={faviconUrl} />
			<Main>
				<Header 
					title ={t("pages.settings.title")}
					icon ={<Settings size={20}/>}
				/>
				<Content>
					<LanguageSelector key="lang" />
					<ToggleThemeSwitch />
				</Content>
			</Main>
    </>
  );
}

const Main = styled.main` 
	flex: 1; 
	display: flex; 
	flex-direction: column; 
	width: 100%; 
	background-color: var(--color-background);
`;

const Content = styled.section` 
	flex: 1; 
	padding: 24px; 
`;