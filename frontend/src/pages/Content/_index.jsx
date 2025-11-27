import React from "react";
import styled from "styled-components";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "../../components/layout/Header";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import TagsManager from "../../components/TagsManager";
import ModulesManager from "../../components/ModulesManager";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";

// --- ContentPage ---
export default function ContentPage() {
	const { t } = useTranslation();

	return (
		<>
			<FaviconTitle title={t("pages.ContentPage")} iconHref={faviconUrl} />
			<Main>
				<Header title={t("pages.settings.title")} icon={<Settings size={20} />} />
				<Content>
					<Tabs defaultValue="tags">
						<TabsList>
							<TabsTrigger value="tags">Tags</TabsTrigger>
							<TabsTrigger value="modules">Modules</TabsTrigger>
						</TabsList>

						<TabsContent value="tags">
							<TagsManager languages={["en", "fr", "de"]} />
						</TabsContent>

						<TabsContent value="modules">
							<ModulesManager languages={["en", "fr", "de"]} />
						</TabsContent>
					</Tabs>
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
