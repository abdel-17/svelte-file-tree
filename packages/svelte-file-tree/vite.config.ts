import { sveltekit } from "@sveltejs/kit/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [sveltekit(), svelteTesting()],
	test: {
		include: ["./src/lib/test/**/*.{test,spec}.{js,ts}"],
		environment: "jsdom",
		setupFiles: ["./src/lib/test/vitest.setup.ts"],
	},
});
