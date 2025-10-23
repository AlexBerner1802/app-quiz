import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";
import {useTranslation} from "react-i18next";

export default function Search() {

	const {t} = useTranslation();

	return (
		<>
			<FaviconTitle title={t("pages.searchPage")} iconHref={faviconUrl} />
		</>
	)
};