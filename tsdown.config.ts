import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	dts: true,
	external: ["mdx/types.js"],
	entry: ["./src/**/*.ts", "./src/**/*.tsx", "!./src/**/*.test.ts"],
	format: ["esm"],
	minify: false,
	sourcemap: true,
	treeshake: true,
	unbundle: true,
});
