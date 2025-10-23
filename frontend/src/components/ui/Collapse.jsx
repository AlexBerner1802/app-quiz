import { useEffect, useRef, useState } from "react";

const Collapse = ({ isOpen, children, style = {}, duration = 300 }) => {
	const contentRef = useRef(null);
	const [maxHeight, setMaxHeight] = useState("0px");
	const [overflow, setOverflow] = useState("hidden");

	useEffect(() => {
		if (!contentRef.current) return;

		const el = contentRef.current;

		if (isOpen) {
			setMaxHeight(`${el.scrollHeight}px`);
			setOverflow("hidden");

			const timeout = setTimeout(() => {
				setOverflow("visible");
				setMaxHeight("none");
			}, duration);

			return () => clearTimeout(timeout);
		} else {
			setMaxHeight(`${el.scrollHeight}px`);
			setOverflow("hidden");

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setMaxHeight("0px");
				});
			});
		}
	}, [isOpen, children, duration]);

	return (
		<div
			ref={contentRef}
			style={{
				maxHeight,
				overflow,
				transition: `max-height ${duration}ms ease`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

export default Collapse;
