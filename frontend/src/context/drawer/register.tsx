// src/contexts/drawer/register.ts
import { FilterDrawer } from "../../components/drawers/FilterDrawer.jsx";
import { QuizResultsDrawer } from "../../components/drawers/QuizResultsDrawer.jsx";

export const drawerRegistry = {
    filter: FilterDrawer,
    quizResult: QuizResultsDrawer,
};

export type DrawerKey = keyof typeof drawerRegistry;
