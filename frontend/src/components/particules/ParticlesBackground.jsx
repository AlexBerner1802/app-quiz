import React, { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { presetLoaders, customPresets } from "./customPresets";
import styled, { keyframes } from "styled-components";
import { useTheme } from "../../context/theme";
import * as culori from "culori";

export default function ParticlesBackground({
												preset = "default",
												colors,
												background,
												cssVar = "--color-primary-bg",
												fallback = "#ff0000",
												fullScreen = true,
											}) {
	const { theme } = useTheme();
	const [engineLoaded, setEngineLoaded] = useState(false);
	const [particleColor, setParticleColor] = useState(fallback);

	// Load engine + official presets
	useEffect(() => {
		initParticlesEngine(async (engine) => {
			await loadSlim(engine);
			if (presetLoaders[preset]) {
				await presetLoaders[preset](engine);
			}
			setEngineLoaded(true);
		});
	}, [preset]);

	// Get CSS variable color
	useEffect(() => {
		const root = document.documentElement;
		let val;
		try {
			const cssVal = getComputedStyle(root).getPropertyValue(cssVar).trim();
			if (cssVal) {
				if (cssVal.startsWith("oklch")) {
					const match = cssVal.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
					if (match) {
						const [_, l, c, h] = match.map(Number);
						val = culori.formatRgb(culori.oklch({ l, c, h }));
					}
				} else {
					val = cssVal;
				}
			}
		} catch {}
		setParticleColor(val);
	}, [theme, cssVar]);

	const options = useMemo(() => {
		// Start with custom preset if exists
		let baseOptions = customPresets[preset]
			? { ...customPresets[preset] }
			: {
				preset,
				fullScreen: { enable: !!fullScreen, zIndex: 0 },
				background: { color: background || "transparent" },
				particles: {
					...(colors || particleColor ? { color: { value: colors || particleColor } } : {}),
				},
			};

		// Extra tweaks for certain presets
		if (preset === "links") {
			baseOptions.particles.links = {
				enable: true,
				color: colors || particleColor || "#ffffff",
				distance: 150,
				opacity: 0.5,
				width: 1,
			};
			baseOptions.particles.move = {
				enable: true,
				speed: 2,
				outModes: { default: "bounce" },
			};
		}

		if (preset === "confetti") {
			baseOptions.emitters = [
				{
					position: { x: 50, y: 100 },
					rate: { quantity: 10, delay: 0.2 }, // repeat every 0.2s
					size: { width: 0, height: 0 },
				},
			];
		}

		return baseOptions;
	}, [preset, colors, particleColor, background, fullScreen]);

	return (
		<Wrap $fullScreen={fullScreen}>
			{engineLoaded && <Particles id="tsparticles" options={options} />}
		</Wrap>
	);
}

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const Wrap = styled.div`
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    animation: ${fadeIn} 1s ease-in;
`;
