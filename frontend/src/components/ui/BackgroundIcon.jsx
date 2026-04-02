import React from "react";
import styled from "styled-components";

export default function BackgroundIcon({
										   icon: Icon,
										   size = 1200,
										   color = "var(--color-text)",
										   opacity = 0.2,
										   bottom = "-360px",
										   right = "-200px",
										   rotate = "-30deg",
									   }) {
	return (
		<Wrapper
			$bottom={bottom}
			$right={right}
			$rotate={rotate}
			$opacity={opacity}
		>
			<Icon size={size} color={color} />
		</Wrapper>
	);
}

const Wrapper = styled.div`
  position: absolute;
  bottom: ${({ $bottom }) => $bottom};
  right: ${({ $right }) => $right};
  transform: rotate(${({ $rotate }) => $rotate});
  z-index: 0;
  pointer-events: none;
  opacity: ${({ $opacity }) => $opacity};
`;