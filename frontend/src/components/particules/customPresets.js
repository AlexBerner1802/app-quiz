import { loadFirePreset } from "@tsparticles/preset-fire";
import { loadConfettiPreset } from "@tsparticles/preset-confetti";
import { loadSnowPreset } from "@tsparticles/preset-snow";
import { loadFountainPreset } from "@tsparticles/preset-fountain";
import { loadLinksPreset } from "@tsparticles/preset-links";

// Example of a custom preset
export const confettiRainbowPreset = {
	background: { color: "transparent" },
	particles: {
		angle: { value: 0, offset: 30 },
		move: {
			enable: true,
			outModes: { top: "none", default: "destroy" },
			gravity: { enable: true },
			speed: { min: 5, max: 25 }, // slightly faster
			decay: 0.005,               // particles last longer
		},
		number: { value: 0, limit: 1000 }, // increased total limit
		opacity: { value: 1 },
		shape: { type: ["circle", "square", "triangle"] },
		size: { value: { min: 2, max: 6 }, animation: { enable: true, speed: 5, sync: true } },
		rotate: { value: { min: 0, max: 360 }, direction: "random", animation: { enable: true, speed: 60 } },
		tilt: { direction: "random", enable: true, value: { min: 0, max: 360 }, animation: { enable: true, speed: 60 } },
		roll: { darken: { enable: true, value: 25 }, enable: true, speed: { min: 15, max: 30 } },
		wobble: { distance: 30, enable: true, speed: { min: -20, max: 20 } },
	},
	emitters: [
		{ direction: "top-right", rate: { quantity: 30, delay: 0.2 }, size: { width: 0, height: 0 }, position: { x: 0, y: 30 } },
		{ direction: "top-left", rate: { quantity: 30, delay: 0.2 }, size: { width: 0, height: 0 }, position: { x: 100, y: 30 } },
	],
};


// Mapping of all presets (official + custom)
export const presetLoaders = {
	fire: loadFirePreset,
	confetti: loadConfettiPreset,
	snow: loadSnowPreset,
	fountain: loadFountainPreset,
	links: loadLinksPreset,
};

export const customPresets = {
	"confetti-rainbow": confettiRainbowPreset,
};
