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

	function resolveColor(value) {
		const root = document.documentElement;
		try {
			const cssVal = getComputedStyle(root).getPropertyValue(value).trim();
			if (cssVal.startsWith("oklch")) {
				const parsed = culori.parse(cssVal);
				if (parsed) return culori.formatRgb(parsed);
			}
			return cssVal || value;
		} catch {
			return value;
		}
	}

	const resolvedColors = useMemo(() => {
		if (!colors) return null;
		return colors.map(c => resolveColor(c));
	}, [colors]);



	// Load engine + official presets
	useEffect(() => {
		initParticlesEngine(async (engine) => {
			await loadSlim(engine);

			// Load official preset
			if (presetLoaders[preset]) {
				await presetLoaders[preset](engine);
			}

			// Register custom presets
			Object.entries(customPresets).forEach(([name, options]) => {
				engine.addPreset(name, options);
			});

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
					// Convert OKLCH to RGB
					const parsed = culori.parse(cssVal);  // culori.parse understands "oklch(...)"
					if (parsed) {
						val = culori.formatRgb(parsed);  // returns "rgb(r,g,b)"
					}
				} else {
					val = cssVal;
				}
			}
		} catch (e) {
			console.warn("Failed to parse CSS variable for particles:", e);
		}
		setParticleColor(val);
	}, [theme, cssVar]);


	const options = useMemo(() => {
		if (customPresets[preset]) {
			const base = customPresets[preset];
			return {
				...base,
				fullScreen: { enable: !!fullScreen, zIndex: 0 },
				background: { color: background || "transparent" },
				particles: {
					...base.particles,
					...(resolvedColors || particleColor
						? { color: { value: resolvedColors || particleColor } }
						: {}),
				},
			};
		}

		// fallback for official presets
		let baseOptions = {
			preset,
			fullScreen: { enable: !!fullScreen, zIndex: 0 },
			background: { color: background || "transparent" },
			particles: {
				...(colors || particleColor ? { color: { value: colors || particleColor } } : {}),
			},
		};

		if (preset === "links") {
			baseOptions.particles.links = {
				enable: true,
				color: colors || particleColor || "#ffffff",
				distance: 150,
				opacity: 0.5,
				width: 1,
			};
			baseOptions.particles.move = { enable: true, speed: 2, outModes: { default: "bounce" } };
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
