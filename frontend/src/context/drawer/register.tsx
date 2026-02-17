// src/contexts/drawer/register.ts
import { FilterDrawer } from "../../components/drawers/FilterDrawer.jsx";
import { QuizResultsDrawer } from "../../components/drawers/QuizResultsDrawer.jsx";
import { QuizPreviewDrawer } from "../../components/drawers/QuizPreviewDrawer.jsx";

export const drawerRegistry = {
    filter: FilterDrawer,
    quizResult: QuizResultsDrawer,
    quizPreview: QuizPreviewDrawer,
};

export type DrawerKey = keyof typeof drawerRegistry;
