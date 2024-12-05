import slugify from "@sindresorhus/slugify";

import type { Paths } from "./resources";

export function createAssetOptions<TPath extends `/${string}/`>(
	path: Paths<TPath>["assetPath"] | Paths<TPath>["downloadPath"],
) {
	return {
		directory: `./public/assets${path}` as const,
		publicPath: `/assets${path}` as const,
		transformFilename(originalFilename: string) {
			return slugify(originalFilename, { preserveCharacters: ["."] });
		},
	};
}
