/** @typedef {import("typescript-eslint").Config} Config */

import base from "@acdh-oeaw/eslint-config";
import node from "@acdh-oeaw/eslint-config-node";
import gitignore from "eslint-config-flat-gitignore";

/** @type {Config} */
const config = [gitignore(), ...base, ...node];

export default config;
