import slugify from "@sindresorhus/slugify";

export function createAssetOptions<TPath extends `/${string}/`>(path: TPath) {
	return {
		directory: `./public/assets${path}` as const,
		publicPath: `/assets${path}` as const,
		transformFilename(originalFilename: string) {
			return slugify(originalFilename, { preserveCharacters: ["."] });
		},
	};
}
