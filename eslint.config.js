import eslint from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

const extraFileExtensions = [".svelte"];

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	svelte.configs["flat/recommended"],
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: true,
				extraFileExtensions,
			},
		},
		rules: {
			"@typescript-eslint/no-non-null-assertion": "off",
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
			"@typescript-eslint/unbound-method": "off",
		},
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				projectService: true,
				extraFileExtensions,
			},
		},
		rules: {
			// Typed linting is not fully supported in Svelte files,
			// which causes a lot of false positives.
			"@typescript-eslint/no-confusing-void-expression": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
		},
	},
	{
		ignores: ["**/.svelte-kit", "**/dist", "**/build"],
	}
);
