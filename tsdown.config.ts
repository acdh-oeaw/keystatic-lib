import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	dts: true,
	entry: ["./src/**/*.ts", "!./src/**/*.test.ts"],
	format: ["esm"],
	minify: false,
	sourcemap: true,
	treeshake: true,
	unbundle: true,
});
