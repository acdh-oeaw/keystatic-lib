import base from "@acdh-oeaw/eslint-config";
import node from "@acdh-oeaw/eslint-config-node";
import react from "@acdh-oeaw/eslint-config-react";
import gitignore from "eslint-config-flat-gitignore";
import globals from "globals";
import { config } from "typescript-eslint";

export default config(
	gitignore({ strict: false }),
	{
		/** Typechecked against built `dist` declarations by `pnpm run types:check:dist`. */
		ignores: ["fixtures/dist-types/**"],
	},
	base,
	{
		ignores: ["src/fields/**", "src/preview/**"],
		extends: node,
	},
	{
		files: ["src/fields/**", "src/preview/**"],
		extends: react,
	},
	{
		files: ["src/fields/**", "src/preview/**"],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},
);
