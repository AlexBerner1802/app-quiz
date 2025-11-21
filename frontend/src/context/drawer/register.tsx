// src/contexts/drawer/register.ts
import { FilterDrawer } from "../../components/drawers/FilterDrawer.jsx";

export const drawerRegistry = {
    filter: FilterDrawer,
};

export type DrawerKey = keyof typeof drawerRegistry;
