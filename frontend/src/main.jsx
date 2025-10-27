import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {ThemeProvider} from "./context/theme";
import {AuthProvider} from "./context/auth";
import './components/ui/styles/index.css'
import './i18n';
import App from './App.jsx'
import {SkeletonTheme} from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import {ModalProvider} from "./context/modal";

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<AuthProvider>
			<ThemeProvider>
				<ModalProvider>
					<SkeletonTheme baseColor={"var(--color-skeleton-base)"} highlightColor={"var(--color-skeleton-highlight)"}>
						<App />
					</SkeletonTheme>
				</ModalProvider>
			</ThemeProvider>
		</AuthProvider>
	</StrictMode>,
)
