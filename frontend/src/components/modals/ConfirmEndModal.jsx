import React from "react";
import styled from "styled-components";
import { Overlay, Dialog } from "../../context/modal/ModalProvider";
import Button from "../ui/Button";
import { t } from "i18next";

export default function ConfirmEndModal({
    onConfirm,
    onCancel,
    saving = false,
    onClose,
}) {
  const handleCancel = () => {
        onCancel?.();
        onClose?.();
  };

  const handleConfirm = async () => {
        await onConfirm?.();
        onClose?.();
  };

    return (
        <Overlay
            onMouseDown={(e) => {
                if (saving) return;
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <Dialog onMouseDown={(e) => e.stopPropagation()}>
                <Content>
                    <Title>{t("quiz.almostThere")}</Title>
                    <Message>{t("quiz.ready")}</Message>

                    <ButtonsRow>
                        <Button
                            onClick={handleCancel}
                            variant="secondary"
                            disabled={saving}
                        >
                        {t("common.no")}
                        </Button>

                        <Button
                            onClick={handleConfirm}
                            variant="primary"
                            disabled={saving}
                        >
                        {saving ? "Saving..." : t("common.yes")}
                        </Button>
                    </ButtonsRow>
                </Content>
            </Dialog>
        </Overlay>
    );
}

const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--spacing);
`;

const Title = styled.h2`
    margin: 0;
    font-size: var(--font-size-2xl);
    color: var(--color-primary-bg);
`;

const Message = styled.p`
    margin: 0 0 var(--spacing);
    font-size: var(--font-size-l);
    color: var(--color-text);
    font-weight: 500;
`;

const ButtonsRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-s);
`;
