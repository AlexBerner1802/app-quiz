// src/pages/QuizEditor/RightSidebar.jsx

import React from "react";
import styled from "styled-components";
import {SquareChevronRight, Languages, Type, MonitorCheck, Save as DiskIcon, Trash2, Plus} from "lucide-react";
import Button from "../../components/ui/Button";
import { useTranslation } from "react-i18next";
import ToggleSwitch from "../../components/buttons/ToggleSwitchButton";
import {useModal} from "../../context/modal";

export default function RightSidebar({
										 visible = true,
										 onHide,
										 langsStatus,
										 currentLang,
										 onCreateTranslation,
										 onToggleActive,
										 onChangeLang,
										 onDeleteLang
									 }) {

	const { t } = useTranslation();
	const { openModal } = useModal();

	return (
		<SidebarWrapper $visible={visible}>
			<RightPanel>
				<Header>
					<HideButton onClick={onHide}>
						<SquareChevronRight size={24} color={"var(--color-text)"} />
					</HideButton>
					<RightTitle>
						{t("common.languages")}
						<Languages size={22} />
					</RightTitle>
				</Header>

				<Content>

					<LangGrid>
						<Button
							variant="outline"
							onClick={() =>
								openModal("selectLanguage", {
									currentLangs: langsStatus
										.filter(l => l.code === currentLang || l.hasTranslation || l.isDirty)
										.map(l => l.code),
									onAdd: (newLangCode) => onCreateTranslation(newLangCode),
								})
							}
							style={{ width: "100%" }}
						>
							<Plus size={16} /> {t("quiz.add_language")}
						</Button>

						{langsStatus
							.filter((lang) =>
								lang.code === currentLang ||	// always show current
								lang.is_active ||            	// active languages
								lang.has_translation ||			// existing saved translations
								lang.is_dirty					// newly added but unsaved languages
							)
							.map((lang) => {
								const { has_translation, is_active, is_dirty } = lang;
								const isCurrent = lang.code === currentLang;

								return (
									<LangCard
										key={lang.code}
										$current={isCurrent}
										onClick={() => !isCurrent && onChangeLang(lang.code)}
									>
										<LangHeaderRow>
											<LangFlag>{lang.label}</LangFlag>
											<LangIcons>
												<IconWrapper
													data-tooltip={has_translation ? "Translation exists" : "No translation"}
													color={has_translation ? "var(--color-primary-bg)" : "var(--color-text-muted)"}
												>
													<Type size={16} />
												</IconWrapper>

												<IconWrapper
													data-tooltip={is_active ? "Active" : "Inactive"}
													color={is_active ? "var(--color-success-bg)" : "var(--color-text-muted)"}
												>
													<MonitorCheck size={16} />
												</IconWrapper>

												<IconWrapper
													data-tooltip="Unsaved changes"
													color={is_dirty ? "var(--color-warning-bg)" : "var(--color-success-bg)"}
												>
													<DiskIcon size={16} />
												</IconWrapper>
											</LangIcons>
										</LangHeaderRow>

										{isCurrent && (
											<ControlGroup>
												<EraseButton
													variant={"ghost"}
													title={t("actions.delete_language") || "Remove language"}
													onClick={(e) => {
														e.stopPropagation();
														openModal("confirm", {
															title: t("actions.confirm_delete_lang_title") || "Delete this language?",
															message:
																t("actions.confirm_delete_lang_message", { lang: lang.code }) ||
																`Are you sure you want to remove ${lang.code}?`,
															onConfirm: () => onDeleteLang(lang.code),
														});
													}}
												>
													<Trash2 size={16} />
												</EraseButton>

												<ToggleSwitch
													checked={!!is_active}
													onChange={() => onToggleActive(currentLang)}
													onLabel="Active"
													offLabel="Inactive"
													onColor="var(--color-success-bg)"
													offColor="var(--color-text-muted)"
												/>
											</ControlGroup>
										)}
									</LangCard>
								);
							})}
					</LangGrid>

				</Content>
			</RightPanel>
		</SidebarWrapper>
	);
}

/* Styled Components */
const SidebarWrapper = styled.div`
    position: relative;
    transition: transform 0.3s ease;
    transform: ${({ $visible }) => ($visible ? "translateX(0)" : "translateX(100%)")};
    flex-shrink: 0;
    z-index: 20;
`;

const RightPanel = styled.aside`
    width: var(--spacing-8xl);
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--color-border);
    height: 100%;
    background-color: var(--color-background-muted);
    position: relative;
`;

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-2xs);
    padding: var(--spacing-l);
`;

const RightTitle = styled.h2`
	display: flex;
	align-items: center;
	gap: var(--spacing-s);
    font-size: var(--font-size);
	color: var(--color-text-muted);
    font-weight: 600;
    margin: 0;
`;

const HideButton = styled.div`
    cursor: pointer;
    &:hover {
        svg {
            transition: all 0.2s ease;
            stroke: var(--color-primary-bg);
        }
    }
`;

const Content = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
    padding: 0 var(--spacing-l) var(--spacing);
    gap: var(--spacing);

	scrollbar-width: thin;
	scrollbar-color: var(--color-primary-bg) var(--color-background-muted);

	&::-webkit-scrollbar {
		width: 8px;
	}
	&::-webkit-scrollbar-track {
		background: var(--color-background-muted);
		border-radius: 8px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: var(--color-primary-bg);
		border-radius: 8px;
		border: 2px solid var(--color-background-muted);
	}
	&::-webkit-scrollbar-thumb:hover {
		background-color: var(--color-primary-bg-hover);
	}
`;

const LangGrid = styled.div`
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
`;

const LangCard = styled.div`
    width: 100%;
    border: 1px solid ${({ $current }) => ($current ? "var(--color-primary-bg-hover)" : "var(--color-border)")};
    border-radius: var(--border-radius-xs);
    padding: var(--spacing);
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xs);
    background-color: ${({ $current }) => ($current ? "var(--color-primary-muted)" : "transparent")};
    cursor: pointer;
    transition: border 0.2s, background-color 0.2s;

	&:hover {
		border-color: var(--color-primary-bg);
    }
`;

const LangHeaderRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const LangFlag = styled.p`
    font-size: var(--font-size);
`;

const LangIcons = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const IconWrapper = styled.div`
    color: ${({ color }) => color || "inherit"};
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 120%;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--color-background);
        color: var(--color-text);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        opacity: 1;
        visibility: visible;
        transition: opacity 0.2s;
    }

    &::after {
        content: '';
        opacity: 0;
        visibility: hidden;
    }
`;

const ControlGroup = styled.div`
    display: flex;
    align-items: center;
	justify-content: space-between;
	padding-top: var(--spacing);
    gap: var(--spacing-xs);
`;

const EraseButton = styled.div`
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-s);
    border-radius: var(--border-radius-xs);
    line-height: 0;
    transition: color .2s ease;

    &:hover {
        background: transparent !important;
        color: var(--color-error-bg);
        border: 1px solid var(--color-error-bg);
    }

    &:active {
        transform: scale(0.92);
    }
`;
