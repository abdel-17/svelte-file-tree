import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
		environment: "jsdom",
	},
	resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
});
