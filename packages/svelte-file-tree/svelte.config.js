import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		typescript: {
			config(config) {
				return {
					...config,
					include: [...config.include, "../vitest.workspace.ts"],
				};
			},
		},
	},
};
