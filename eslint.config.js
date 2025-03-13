import eslint from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

const extraFileExtensions = [".svelte"];

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions,
			},
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.js", "**/*.svelte.ts"],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				projectService: true,
				extraFileExtensions,
			},
		},
	},
	{
		rules: {
			"@typescript-eslint/no-unnecessary-condition": [
				"error",
				{
					allowConstantLoopConditions: "only-allowed-literals",
				},
			],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{
					allowNumber: true,
				},
			],
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			"@typescript-eslint/array-type": [
				"error",
				{
					default: "generic",
				},
			],
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/strict-boolean-expressions": [
				"error",
				{
					allowNullableObject: false,
					allowNumber: false,
					allowString: false,
				},
			],
		},
	},
	{
		files: ["**/*.svelte"],
		extends: [tseslint.configs.disableTypeChecked],
	},
	{
		ignores: ["**/.svelte-kit", "**/dist", "**/build"],
	}
);
