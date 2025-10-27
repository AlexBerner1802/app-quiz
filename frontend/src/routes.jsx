// routes.jsx
import HomePage from "./pages/Home/_index";
import LoginPage from "./pages/Login/_index";
import NewQuiz from "./pages/QuizEditor/_index";
import SettingsPage from "./pages/Settings/_index";
import Users from "./pages/Users/_index";
import ShowQuiz from "./pages/ShowQuiz/_index.jsx";
import AppLayout from "./components/layout/AppLayout";

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
		layout: AppLayout
	},
	{
		path: "*",
		element: <HomePage />, // fallback to home
		protected: true,
		layout: AppLayout
	},
];
