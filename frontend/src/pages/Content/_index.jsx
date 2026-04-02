import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "../../components/layout/Header";
import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import TagsManager from "../../components/TagsManager";
import ModulesManager from "../../components/ModulesManager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { getModules, getTags } from "../../services/api";
import Invader from "../../components/icons/Invader";
import BackgroundIcon from "../../components/ui/BackgroundIcon";
import Spinner from "../../components/ui/Spinner";


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

		init().then(() => false);

		return () => {
			if (timeoutId) window.clearTimeout(timeoutId);
		};
	}, []);

	const isBusy = loading || showLoader;


	if (isBusy) {
		return (
			<Main>
				<FaviconTitle title={t("pages.contentPage")} iconHref={faviconUrl} />
				<LoadingWrapper>
					<Spinner />
				</LoadingWrapper>
			</Main>
		)
	}

  	return (
    	<Main>
			<FaviconTitle title={t("pages.contentPage")} iconHref={faviconUrl} />

			<BackgroundIcon icon={Invader} />

			<Container>
				<Header title={t("pages.content.title")} icon={<Settings size={20} />} />

				<Content>
					{error ? (
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
			</Container>
		</Main>
	);
}


const Main = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    background: var(--color-background);
    position: relative;
    overflow: hidden;
`;

const Container = styled.main`
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;
	background-color: var(--color-background);
    min-height: 100vh;
	overflow: auto;
`;

const Content = styled.section`
	flex: 1;
	padding: 24px;
`;

const LoadingWrapper = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ErrorBox = styled.div`
	padding: 16px;
	border-radius: 12px;
	background: color-mix(in srgb, var(--color-error-bg) 10%, transparent);
	color: var(--color-text);
`;