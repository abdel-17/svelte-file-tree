import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		typescript: {
			config(config) {
				return {
					...config,
					include: [
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						...config.include,
						"../eslint.config.js",
						"../svelte.config.js",
						"../vitest.workspace.ts",
					],
				};
			},
		},
	},
};
