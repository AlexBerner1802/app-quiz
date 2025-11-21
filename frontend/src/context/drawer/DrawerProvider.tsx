// src/contexts/drawer/DrawerProvider.tsx
import {useState, useCallback, useMemo, type ReactNode, type CSSProperties} from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { DrawerContext } from "./DrawerContext";
import { drawerRegistry } from "./register";
import Button from "../../components/ui/Button";

interface DrawerProviderProps {
    children: ReactNode;
}

export const DrawerProvider = ({ children }: DrawerProviderProps) => {
    const [currentDrawer, setCurrentDrawer] = useState<keyof typeof drawerRegistry | null>(null);
    const [drawerProps, setDrawerProps] = useState<any>({});
    const [isOpen, setIsOpen] = useState(false);

    const openDrawer = useCallback((key: keyof typeof drawerRegistry, props?: any) => {
        setCurrentDrawer(key);
        setDrawerProps(props || {});
        setIsOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsOpen(false);
        setTimeout(() => setCurrentDrawer(null), 300);
    }, []);

    const contextValue = useMemo(
        () => ({
            isOpen,
            currentDrawer,
            drawerProps,
            openDrawer,
            closeDrawer,
        }),
        [isOpen, currentDrawer, drawerProps, openDrawer, closeDrawer]
    );

    return (
        <DrawerContext.Provider value={contextValue}>
            {children}

            {Object.entries(drawerRegistry).map(([key, DrawerComp]) => {
                const isActive = currentDrawer === key;
                return (
                    <DrawerWrapper key={key} $isActive={isActive} $open={isOpen && isActive}>
                        {isActive && <DrawerComp {...drawerProps} closeDrawer={closeDrawer} />}
                    </DrawerWrapper>
                );
            })}

            <Overlay $open={isOpen} onClick={closeDrawer} />
        </DrawerContext.Provider>
    );
};

/* -------------------- DrawerHeader + DrawerFooter -------------------- */

interface DrawerHeaderProps {
    title?: string;
    icon?: React.ReactNode;
    onClose?: () => void;
}

export const DrawerHeader = ({ title, icon, onClose }: DrawerHeaderProps) => (
    <HeaderWrapper>
        <HeaderLeft>
            {icon && <IconWrapper>{icon}</IconWrapper>}
            {title && <HeaderTitle>{title}</HeaderTitle>}
        </HeaderLeft>
        <Button
            variant="ghost"
            size="s"
            aria-label="Close Drawer"
            onClick={onClose}
        >
            <X size={24} />
        </Button>
    </HeaderWrapper>
);

interface DrawerFooterProps {
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
}

export const DrawerFooter = ({ children, style, className }: DrawerFooterProps) => (
    <FooterWrapper style={style} className={className}>
        {children}
    </FooterWrapper>
);

/* -------------------- Styled Components -------------------- */

const Overlay = styled.div<{ $open: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-background-overlay, rgba(0, 0, 0, 0.4));
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
    transition: opacity 0.3s ease;
    z-index: 999;
`;

const DrawerWrapper = styled.div<{ $isActive: boolean; $open: boolean }>`
    position: fixed;
    top: var(--spacing-s);
    right: var(--spacing-s);
    width: var(--spacing-9xl);
    height: calc(100vh - (var(--spacing-s) * 2 + 2px));
    background: var(--color-background-surface-2, #fff);
    border: 1px solid var(--color-border, #fff);
    box-shadow: var(--box-shadow-l);
    transform: translateX(${({ $open }) => ($open ? "0" : "110%")});
    transition: transform 0.3s ease;
    z-index: 1000;
    border-radius: var(--border-radius-s);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
`;

const HeaderWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing);
    border-bottom: 1px solid var(--color-border, #e5e5e5);
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: var(--spacing);
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
`;

const HeaderTitle = styled.p`
    font-size: var(--font-size-xl);
    font-weight: 600;
`;

const FooterWrapper = styled.div`
    margin-top: auto;
    padding: var(--spacing);
    border-top: 1px solid var(--color-border, #e5e5e5);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-s);
`;
