// routes.jsx
import HomePage from "./pages/Home/_index";
import LoginPage from "./pages/Login/_index";
import NewQuiz from "./pages/QuizEditor/_index";
import SettingsPage from "./pages/Settings/_index";
import Users from "./pages/Users/_index";
import ShowQuiz from "./pages/ShowQuiz/_index.jsx";
import ResultsPage from "./pages/Results/_index.jsx";
import AppLayout from "./components/layout/AppLayout";
import ContentPage from "./pages/Content/_index";

export const routes = [
	{
		path: "/login",
		element: <LoginPage />,
		protected: false,
	},
	{
		path: "/home",
		element: <HomePage />,
		protected: true,
		layout: AppLayout
	},
	{
		path: "/quizzes/new",
		element: <NewQuiz />,
		protected: true,
	},
	{
		path: "/quizzes/:id/edit",
		element: <NewQuiz />,
		protected: true,
	},
	{
		path: "/content",
		element: <ContentPage />,
		protected: true,
		layout: AppLayout
	},
	{
		path: "/settings",
		element: <SettingsPage />,
		protected: true,
		layout: AppLayout
	},
	{
		path: "/users",
		element: <Users />,
		protected: true,
		layout: AppLayout
	},
	{
		path: "/quizzes/:id",
		element: <ShowQuiz />,
		protected: true,
	},
	{
		path: "results",
		element: <ResultsPage />,
		protected: true,
		layout: AppLayout
	},
	{
		path: "*",
		element: <HomePage />, // fallback to home
		protected: true,
		layout: AppLayout
	},
];
