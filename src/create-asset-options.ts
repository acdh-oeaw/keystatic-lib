import slugify from "@sindresorhus/slugify";

import type { Paths } from "./resources";

export function createAssetOptions<TPath extends `/${string}/`>(paths: Paths<TPath>) {
	return {
		directory: `./public/assets${paths.assetPath}` as const,
		publicPath: `/assets${paths.assetPath}` as const,
		transformFilename(originalFilename: string) {
			return slugify(originalFilename, { preserveCharacters: ["."] });
		},
	};
}
