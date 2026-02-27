import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Settings, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "../../components/layout/Header";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import TagsManager from "../../components/TagsManager";
import ModulesManager from "../../components/ModulesManager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { getModules, getTags } from "../../services/api";

export default function ContentPage() {
	const { t } = useTranslation();

	const [loading, setLoading] = useState(true);
	const [showLoader, setShowLoader] = useState(true);
	const [modules, setModules] = useState([]);
	const [tags, setTags] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		let timeoutId;

		const init = async () => {
		try {
			setLoading(true);
			setShowLoader(true);
			setError(null);

			const [allModules, allTags] = await Promise.all([getModules(), getTags()]);
			setModules(allModules || []);
			setTags(allTags || []);
		} catch (e) {
			console.error(e);
			setError(e);
		} finally {
			setShowLoader(false);
			timeoutId = window.setTimeout(() => setLoading(false), 300);
		}
		};

		init();

		return () => {
			if (timeoutId) window.clearTimeout(timeoutId);
		};
	}, []);

	const isBusy = loading || showLoader;

  	return (
    	<>
			<FaviconTitle title={t("pages.contentPage")} iconHref={faviconUrl} />
			<Main>
				<Header title={t("pages.content.title")} icon={<Settings size={20} />} />

				<Content>
					{isBusy ? (
						<LoadingWrap>
							<Loader2 size={22} className="spin" />
							<span>{t("common.loading")}</span>
						</LoadingWrap>
					) : error ? (
						<ErrorBox>
							{t("common.errorLoading")}
						</ErrorBox>
					) : (
						<Tabs defaultValue="tags">
							<TabsList>
								<TabsTrigger value="tags">{t("common.tags")}</TabsTrigger>
								<TabsTrigger value="modules">{t("common.modules")}</TabsTrigger>
							</TabsList>

							<TabsContent value="tags">
								<TagsManager tags={tags} loading={false} showLoader={false} />
							</TabsContent>

							<TabsContent value="modules">
								<ModulesManager modules={modules} />
							</TabsContent>
						</Tabs>
					)}
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

const LoadingWrap = styled.div`
	min-height: 240px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	color: var(--color-text);

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
`;

const ErrorBox = styled.div`
	padding: 16px;
	border-radius: 12px;
	background: color-mix(in srgb, var(--color-danger) 10%, transparent);
	color: var(--color-text);
`;