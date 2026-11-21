/**
 * Typechecks the consumer fixture in `fixtures/dist-types` against the built `dist` declarations, with
 * `skipLibCheck: false`.
 *
 * Diagnostics in third-party declarations (`node_modules`) are ignored, because some transitive
 * dependencies ship declarations which do not typecheck on their own. Every other diagnostic, i.e.
 * in `dist` or in the fixture itself, fails the check.
 */

import { existsSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
	createProgram,
	type Diagnostic,
	type FormatDiagnosticsHost,
	formatDiagnosticsWithColorAndContext,
	getPreEmitDiagnostics,
	parseJsonConfigFileContent,
	readConfigFile,
	sys,
} from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "fixtures", "dist-types", "tsconfig.json");

const host: FormatDiagnosticsHost = {
	getCanonicalFileName(fileName) {
		return fileName;
	},
	getCurrentDirectory() {
		return root;
	},
	getNewLine() {
		return sys.newLine;
	},
};

if (!existsSync(join(root, "dist", "index.d.ts"))) {
	throw new Error('No declarations found in "dist". Run "pnpm run build" first.');
}

const { config, error } = readConfigFile(configPath, (path) => {
	return sys.readFile(path);
}) as { config?: unknown; error?: Diagnostic };

if (error != null) {
	throw new Error(formatDiagnosticsWithColorAndContext([error], host));
}

const parsed = parseJsonConfigFileContent(config, sys, dirname(configPath));
const options = { ...parsed.options, noEmit: true, skipLibCheck: false };
const program = createProgram({ rootNames: parsed.fileNames, options });

const diagnostics = getPreEmitDiagnostics(program).filter((diagnostic) => {
	if (diagnostic.file == null) {
		return true;
	}

	return !diagnostic.file.fileName.split(/[/\\]/).includes("node_modules");
});

if (diagnostics.length > 0) {
	console.error(formatDiagnosticsWithColorAndContext(diagnostics, host));
	process.exitCode = 1;
} else {
	const distDir = `${join(root, "dist").replaceAll(sep, "/")}/`;
	const count = program.getSourceFiles().filter((file) => {
		return file.fileName.startsWith(distDir);
	}).length;

	console.warn(`Checked ${String(count)} declaration files in "dist".`);
}
