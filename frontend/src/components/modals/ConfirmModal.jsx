import React from 'react';
import {Dialog, Overlay} from "../../context/modal/ModalProvider";

export default function ConfirmModal({ title = 'Are you sure?', message, onConfirm, onClose }) {
	return (
		<Overlay onClick={onClose}>
			<Dialog onClick={(e) => e.stopPropagation()}>
				<h3>{title}</h3>
				<p>{message}</p>
				<div className="actions">
					<button onClick={() => {
						onConfirm();
						onClose();
					}}>Confirm</button>
					<button onClick={onClose}>Cancel</button>
				</div>
			</Dialog>
		</Overlay>
	);
}
