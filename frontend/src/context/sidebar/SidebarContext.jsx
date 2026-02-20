import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children, defaultExpanded = false }) {
    const [expanded, setExpanded] = useState(() => {
        const saved = localStorage.getItem("sidebar_expanded");
        if (saved === "1") return true;
        if (saved === "0") return false;
        return defaultExpanded;
    });

    const setExpandedSafe = useCallback((value) => {
        setExpanded(value);
        localStorage.setItem("sidebar_expanded", value ? "1" : "0");
    }, []);

    const toggle = useCallback(() => {
        setExpanded((prev) => {
            const next = !prev;
            localStorage.setItem("sidebar_expanded", next ? "1" : "0");
            return next;
        });
    }, []);

    const value = useMemo(
        () => ({
            expanded,
            setExpanded: setExpandedSafe,
            toggle,
        }),
        [expanded, setExpandedSafe, toggle]
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error("useSidebar must be used within <SidebarProvider />");
    }
    return ctx;
}