// src/components/layout/Icon.jsx

import { useEffect } from "react";


export default function FaviconTitle({ title, iconHref, type = "image/svg+xml" }) {

	useEffect(() => {
		if (title) document.title = title;

		if (iconHref) {
			let link = document.querySelector("link[rel='icon']") || document.createElement("link");
			link.rel = "icon";
			if (type) link.type = type;
			link.href = iconHref;
			if (!link.parentNode) document.head.appendChild(link);
		}
	}, [title, iconHref, type]);

	return null;
}
