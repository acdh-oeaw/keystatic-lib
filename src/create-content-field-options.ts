import { createAssetOptions } from "./create-asset-options";

export function createContentFieldOptions<TPath extends `/${string}/`>(assetPath: TPath) {
	const assetPaths = createAssetOptions(assetPath);
	const headingLevels = [2, 3, 4, 5] as const;

	return {
		heading: headingLevels,
		image: assetPaths,
	};
}
