import { defineWorkspace } from "vitest/config";
import type { BrowserCommand } from "vitest/node";

type PressCommand = BrowserCommand<[key: string]>;

const press: PressCommand = async (context, key) => {
	await context.page.keyboard.press(key);
};

export default defineWorkspace([
	{
		extends: "./vite.config.ts",
		test: {
			name: "unit",
			include: ["./src/**/*.{test,spec}.{js,ts}"],
			environment: "jsdom",
		},
		resolve: {
			conditions: ["browser"],
		},
	},
	{
		extends: "./vite.config.ts",
		test: {
			name: "browser",
			include: ["./src/**/*.{test,spec}.svelte"],
			browser: {
				enabled: true,
				provider: "playwright",
				name: "chromium",
				commands: { press },
			},
		},
	},
]);

declare module "@vitest/browser/context" {
	interface BrowserCommands {
		press: PressCommand;
	}
}
