// src/pages/QuizEditor/RightSidebar.jsx

import React from "react";
import styled from "styled-components";
import {SquareChevronRight, Save, Type, MonitorCheck, Save as DiskIcon, Trash2} from "lucide-react";
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
										 onSaveCurrent,
										 onSaveClick,
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
					<RightTitle>{t("common.settings")}</RightTitle>
				</Header>

				<Content>
					<LangGrid>
						<Title>Langue</Title>
						{langsStatus
							.filter(
								(lang) =>
									lang.code === currentLang || // always show current
									lang.isActive ||             // active languages
									lang.hasTranslation ||       // existing saved translations
									lang.isDirty                 // newly added but unsaved languages
							)
							.map((lang) => {
								const { hasTranslation, isActive, isDirty } = lang;
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
													data-tooltip={hasTranslation ? "Translation exists" : "No translation"}
													color={hasTranslation ? "var(--color-primary)" : "gray"}
												>
													<Type size={16} />
												</IconWrapper>

												<IconWrapper
													data-tooltip={isActive ? "Active" : "Inactive"}
													color={isActive ? "var(--color-success-bg)" : "gray"}
												>
													<MonitorCheck size={16} />
												</IconWrapper>

												<IconWrapper
													data-tooltip="Unsaved changes"
													color={isDirty ? "var(--color-warning-bg)" : "gray"}
												>
													<DiskIcon size={16} />
												</IconWrapper>
											</LangIcons>
										</LangHeaderRow>

										{isCurrent && (
											<ControlGroup>
												<EraseButton
													title={t("actions.delete_language") || "Remove language"}
													onClick={(e) => {
														e.stopPropagation();
														openModal("confirm", {
															title: t("quiz.confirm_delete_lang_title") || "Delete this language?",
															message:
																t("quiz.confirm_delete_lang_message", { lang: lang.label }) ||
																`Are you sure you want to remove ${lang.label}?`,
															onConfirm: () => onDeleteLang(lang.code),
														});
													}}
												>
													<Trash2 size={16} />
												</EraseButton>

												<ToggleSwitch
													checked={!!isActive}
													onChange={() => onToggleActive(currentLang)}
													onLabel="Active"
													offLabel="Inactive"
													onColor="var(--color-success-bg)"
													offColor="var(--color-placeholder)"
												/>
											</ControlGroup>
										)}
									</LangCard>
								);
							})}
					</LangGrid>

					<AddLanguageBtn
						variant="primary"
						onClick={() =>
							openModal("selectLanguage", {
								currentLangs: [
									currentLang,
									...langsStatus
										.filter(l => l.isActive || l.hasTranslation)
										.map(l => l.code),
								],
								onAdd: (newLangCode) => onCreateTranslation(newLangCode),
							})
						}
						style={{ width: "100%" }}
					>
						Add Language
					</AddLanguageBtn>
				</Content>

				<Footer>
					<SaveButton
						variant="primary"
						onClick={onSaveClick}
						style={{ width: "100%" }}
					>
						<Save size={16} />
						{t("actions.save")}
					</SaveButton>
				</Footer>
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
    background-color: var(--color-background);
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
    font-size: var(--font-size);
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
    padding: 0 var(--spacing-l) var(--spacing-l);
    gap: var(--spacing);

	scrollbar-width: thin;
	scrollbar-color: var(--color-primary-bg) var(--color-surface);

	&::-webkit-scrollbar {
		width: 8px;
	}
	&::-webkit-scrollbar-track {
		background: var(--color-surface);
		border-radius: 8px;
	}
	&::-webkit-scrollbar-thumb {
		background-color: var(--color-primary-bg);
		border-radius: 8px;
		border: 2px solid var(--color-surface);
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

const Title = styled.div`
    font-size: var(--font-size);
    font-weight: 500;
    margin-bottom: var(--spacing-xs, 0.25rem);
    color: var(--color-text, #333);
`;

const LangCard = styled.div`
    width: 100%;
    border: 1px solid ${({ $current }) => ($current ? "var(--color-primary-bg-hover)" : "var(--color-border)")};
    border-radius: var(--border-radius);
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

const LangFlag = styled.span`
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
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 6px;
	background: transparent;
	color: var(--color-error-text, #e74c3c);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
        color: var(--color-error-bg-hover, #e74c3c);
	}
`;

const AddLanguageBtn = styled(Button)`
    border: 1px dashed var(--color-border, #ccc);
    border-radius: var(--border-radius);
    background-color: transparent;
	color: var(--color-text);
	
	&:hover {
        border: 1px solid var(--color-primary-bg);
	}
`;

const Footer = styled.div`
	position: sticky;
	bottom: 0;
	background: var(--color-background);
	border-top: 1px solid var(--color-border);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-xs);
    padding: var(--spacing);
`;

const SaveButton = styled(Button)`
	background: var(--color-success-bg);
	
	&:hover {
		background: var(--color-success-bg-hover)!important;
	}
`;

