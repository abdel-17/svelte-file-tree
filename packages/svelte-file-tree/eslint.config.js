import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default tseslint.config(
	includeIgnoreFile(gitignorePath),
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	tseslint.configs.stylisticTypeCheckedOnly,
	svelte.configs["flat/recommended"],
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".svelte"],
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
		},
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
			},
		},
		rules: {
			"@typescript-eslint/no-confusing-void-expression": "off",
		},
	},
);
