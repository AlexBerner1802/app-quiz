// context/modal/ModalProvider.jsx
import React, { useState, useCallback } from 'react';
import { ModalContext } from './ModalContext.jsx';
import styled, { keyframes } from "styled-components";

/**
 * Registry of modal components.
 * Add any modals here.
 */
import ConfirmModal from '../../components/modals/ConfirmModal';
import SelectLanguageModal from "../../components/modals/SelectLanguageModal";

const MODAL_REGISTRY = {
	confirm: ConfirmModal,
	selectLanguage: SelectLanguageModal,
};

export const ModalProvider = ({ children }) => {
	const [modalName, setModalName] = useState(null);
	const [modalProps, setModalProps] = useState({});
	const isOpen = !!modalName;

	const openModal = useCallback((name, props = {}) => {
		setModalName(name);
		setModalProps(props);
	}, []);

	const closeModal = useCallback(() => {
		setModalName(null);
		setModalProps({});
	}, []);

	const ModalComponent = modalName ? MODAL_REGISTRY[modalName] : null;

	return (
		<ModalContext.Provider
			value={{ openModal, closeModal, isOpen, modalName, modalProps }}
		>
			{children}
			{ModalComponent && (
				<ModalComponent
					{...modalProps}
					onClose={closeModal}
				/>
			)}
		</ModalContext.Provider>
	);
};


const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const zoomIn = keyframes`
    from {
        opacity: 0;
        transform: scale(0.8);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--color-background-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  /* animation */
  animation: ${fadeIn} 0.25s ease forwards;
`;

export const Dialog = styled.div`
  background: var(--color-background-elevated);
  border-radius: var(--border-radius-l);
  padding: var(--spacing-l);
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  /* animation */
  animation: ${zoomIn} 0.25s ease forwards;
`;
