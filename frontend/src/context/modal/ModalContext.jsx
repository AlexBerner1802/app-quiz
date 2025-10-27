// context/modal/ModalContext.jsx
import { createContext, useContext } from 'react';

export const ModalContext = createContext({
	openModal: () => {},
	closeModal: () => {},
	isOpen: false,
	modalName: null,
	modalProps: {},
});

export const useModal = () => useContext(ModalContext);
