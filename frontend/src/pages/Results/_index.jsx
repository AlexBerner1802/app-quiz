import FaviconTitle from "../../components/layout/Icon.jsx";
import faviconUrl from "../../assets/images/favicon.ico?url";

export default function Results() {


return (
    <>
        <FaviconTitle title={t("pages.resultsPage")} iconHref={faviconUrl} />
    </>
)
};