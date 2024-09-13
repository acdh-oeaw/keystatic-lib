/** @typedef {import("typescript-eslint").Config} Config */

import base from "@acdh-oeaw/eslint-config";
import node from "@acdh-oeaw/eslint-config-node";
import react from "@acdh-oeaw/eslint-config-react";
import gitignore from "eslint-config-flat-gitignore";
import globals from "globals";

/** @type {Config} */
const config = [
	gitignore(),
	...base,
	...node.map((config) => {
		return {
			...config,
			ignores: ["src/preview/**"],
		};
	}),
	...react.map((config) => {
		return {
			...config,
			files: ["src/preview/**"],
		};
	}),
	{
		files: ["src/preview/**"],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},
];

export default config;
