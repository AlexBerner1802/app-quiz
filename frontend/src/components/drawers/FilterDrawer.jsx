// src/drawers/FilterDrawer.jsx
import { useState, useEffect } from "react";
import styled from "styled-components";
import Button from "../ui/Button";
import { DrawerHeader, DrawerFooter } from "../../context/drawer/DrawerProvider";
import Tag from "../ui/Tag";
import { Funnel } from "lucide-react";
import { useTranslation } from "react-i18next";

export const FilterDrawer = ({
								 closeDrawer,
								 modules,
								 tags,
								 selectedModules,
								 selectedTags,
								 setSelectedModules,
								 setSelectedTags,
							 }) => {


	const { t } = useTranslation();

	// Local temp values store IDs
	const [tempModules, setTempModules] = useState(selectedModules);
	const [tempTags, setTempTags] = useState(selectedTags);

	const toggleModule = (moduleId) => {
		setTempModules((prev) =>
			prev.includes(moduleId)
				? prev.filter((m) => m !== moduleId)
				: [...prev, moduleId]
		);
	};

	const toggleTag = (tagId) => {
		setTempTags((prev) =>
			prev.includes(tagId)
				? prev.filter((t) => t !== tagId)
				: [...prev, tagId]
		);
	};

	const applyFilters = () => {
		setSelectedModules(tempModules);
		setSelectedTags(tempTags);
		closeDrawer();
	};

	const clearFilters = () => {
		setTempModules([]);
		setTempTags([]);
	};

	useEffect(() => {
		setTempModules(selectedModules);
		setTempTags(selectedTags);
	}, [selectedModules, selectedTags]);

	return (
		<Container>
			<DrawerHeader
				title={t("common.filter")}
				onClose={closeDrawer}
				icon={<Funnel size={20} />}
			/>

			<Content>
				{/* MODULES */}
				{
					modules && (
						<Section>
							<SectionTitle>{t("quiz.sections.modules")}</SectionTitle>
							<TagContainer>
								{modules.map((m) => (
									<Tag
										key={m.id}
										size="l"
										clickable
										variant={
											tempModules.includes(m.id)
												? "primary"
												: "outline"
										}
										onClick={() => toggleModule(m.id)}
									>
										{m.name}
									</Tag>
								))}
							</TagContainer>
						</Section>
					)
				}

				{/* TAGS */}
				{
					tags && (
						<Section>
							<SectionTitle>{t("quiz.sections.tags")}</SectionTitle>
							<TagContainer>
								{tags.map((t) => (
									<Tag
										key={t.id}
										size="l"
										clickable
										variant={
											tempTags.includes(t.id)
												? "primary"
												: "outline"
										}
										onClick={() => toggleTag(t.id)}
									>
										{t.name}
									</Tag>
								))}
							</TagContainer>
						</Section>
					)
				}
			</Content>

			<DrawerFooter style={{ justifyContent: "space-between" }}>
				<Button variant="ghost" onClick={clearFilters}>
					{t("common.clear")}
				</Button>
				<Button variant="primary" onClick={applyFilters}>
					{t("common.apply")}
				</Button>
			</DrawerFooter>
		</Container>
	);
};


const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const Content = styled.div`
    flex: 1;
    padding: var(--spacing);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-l);
    overflow-y: auto;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
`;

const SectionTitle = styled.h4`
    font-size: var(--font-size);
    font-weight: 600;
    margin: 0 0 var(--spacing-s);
`;

const TagContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
`;
