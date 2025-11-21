// src/contexts/drawer/DrawerContext.tsx
import { createContext, useContext } from "react";
import type { DrawerKey } from "./register";

export interface DrawerContextType {
    isOpen: boolean;
    currentDrawer: DrawerKey | null;
    drawerProps?: any;
    openDrawer: (key: DrawerKey, props?: any) => void;
    closeDrawer: () => void;
}

export const DrawerContext = createContext<DrawerContextType | null>(null);

export const useDrawer = () => {
    const ctx = useContext(DrawerContext);
    if (!ctx) throw new Error("useDrawer must be used within a DrawerProvider");
    return ctx;
};
