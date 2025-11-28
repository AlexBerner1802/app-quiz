import React, {useEffect, useState} from "react";
import styled from "styled-components";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "../../components/layout/Header";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import TagsManager from "../../components/TagsManager";
import ModulesManager from "../../components/ModulesManager";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import {getModules, getTags} from "../../services/api";
import i18n from "i18next";

// --- ContentPage ---
export default function ContentPage() {
	
	const { t } = useTranslation();
	const currentLang = i18n.language;
	
	const [loading, setLoading] = useState(true);
	const [showLoader, setShowLoader] = useState(true);
	const [modules, setModules] = useState([]);
	const [tags, setTags] = useState([]);
	
	
	useEffect(() => {
		setLoading(true);

		const init = async () => {
			const [allModules, allTags] = await Promise.all([getModules(), getTags()]);
			setModules(allModules);
			setTags(allTags);

			console.log(allTags)
			console.log(allModules)
		}

		init().then(() => {
			setShowLoader(false);
			setTimeout(() => setLoading(false), 1000);
		});

	}, []);
	
	
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
							{tags && <TagsManager tags={tags} loading={loading} />}
						</TabsContent>

						<TabsContent value="modules">
							{modules && <ModulesManager modules={modules} />}
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
