import React, { useEffect } from "react";
import styled from "styled-components";
import { Dialog, Overlay } from "../../context/modal/ModalProvider";
import Button from "../ui/Button";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ConfirmModal({
	title = "Are you sure?",
	message,
	onConfirm,
	onClose,
}) {
  	const { t } = useTranslation();

  	useEffect(() => {
    	const onKeyDown = (e) => {
      	if (e.key === "Escape") onClose?.();
    	};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

  	return (
		<Overlay onMouseDown={onClose}>
			<Dialog onMouseDown={(e) => e.stopPropagation()}>
				<Header>
					<IconWrap>
						<AlertTriangle size={18} />
					</IconWrap>
					<div>
						<Title>{title}</Title>
						{message ? <Message>{message}</Message> : null}
					</div>
				</Header>

				<Footer>
					<Button variant="secondary" onClick={onClose}>
						{t("common.cancel")}
					</Button>

					<Button
						variant="danger"
						onClick={() => {
						onConfirm?.();
						onClose?.();
						}}
					>
						{t("common.confirm")}
					</Button>
				</Footer>
			</Dialog>
		</Overlay>
  	);
}

const Header = styled.div`
	display: flex;
	gap: var(--spacing-s);
	align-items: flex-start;
`;

const IconWrap = styled.div`
	width: 34px;
	height: 34px;
	border-radius: var(--border-radius);
	display: flex;
	align-items: center;
	justify-content: center;

	background: rgba(220, 38, 38, 0.12);
	color: rgb(220, 38, 38);
	flex: 0 0 auto;
`;

const Title = styled.h3`
	margin: 0;
	font-size: var(--font-size-l);
	font-weight: 650;
	color: var(--color-text);
`;

const Message = styled.p`
	margin: var(--spacing-2xs) 0 0;
	color: var(--color-text-muted);
	line-height: 1.4;
	font-size: var(--font-size);
`;

const Footer = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: var(--spacing-s);
	margin-top: var(--spacing-l);
`;