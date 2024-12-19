/// <reference types="@vitest/browser/providers/playwright" />

import { defineWorkspace } from "vitest/config";
import type { BrowserCommandContext } from "vitest/node";

export default defineWorkspace([
	{
		extends: "./vite.config.ts",
		test: {
			name: "unit",
			include: ["./src/lib/**/*.{test,spec}.{js,ts}"],
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
			include: ["./src/tests/browser/**/*.{test,spec}.{js,ts}"],
			browser: {
				enabled: true,
				provider: "playwright",
				name: "chromium",
				commands: {
					async press(context: BrowserCommandContext, key: string) {
						await context.page.keyboard.press(key);
					},
				},
			},
		},
	},
]);

declare module "@vitest/browser/context" {
	interface BrowserCommands {
		press: (key: string) => Promise<void>;
	}
}
