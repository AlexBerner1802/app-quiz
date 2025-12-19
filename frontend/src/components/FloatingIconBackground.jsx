import { useEffect, useRef, cloneElement, isValidElement } from "react";
import styled from "styled-components";
import Invader from "./icons/Invader";

export default function FloatingIconBackground({
												   size = 160,
												   speed = 0.6,
												   opacity = 0.1,
												   color = "var(--color-text)",
												   icon,
											   }) {
	const ref = useRef(null);
	const pos = useRef({ x: 0, y: 0 });
	const vel = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const { innerWidth, innerHeight } = window;

		pos.current = {
			x: Math.random() * (innerWidth - size),
			y: Math.random() * (innerHeight - size),
		};

		vel.current = {
			x: (Math.random() > 0.5 ? 1 : -1) * speed,
			y: (Math.random() > 0.5 ? 1 : -1) * speed,
		};

		let frame;

		const animate = () => {
			const rect = el.getBoundingClientRect();

			pos.current.x += vel.current.x;
			pos.current.y += vel.current.y;

			if (pos.current.x <= 0 || pos.current.x + rect.width >= innerWidth) {
				vel.current.x *= -1;
			}

			if (pos.current.y <= 0 || pos.current.y + rect.height >= innerHeight) {
				vel.current.y *= -1;
			}

			el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;

			frame = requestAnimationFrame(animate);
		};

		frame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frame);
	}, [size, speed]);

	const renderedIcon =
		icon && isValidElement(icon)
			? cloneElement(icon, {
				size,
				color,
			})
			: <Invader size={size} color={color} />;

	return (
		<Wrapper ref={ref} $opacity={opacity}>
			{renderedIcon}
		</Wrapper>
	);
}

const Wrapper = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 0;
    will-change: transform;
    opacity: ${({ $opacity }) => $opacity};
`;
