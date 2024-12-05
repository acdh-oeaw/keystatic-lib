import { createAssetOptions } from "./create-asset-options";
import type { Paths } from "./resources";

export function createContentFieldOptions<TPath extends `/${string}/`>(paths: Paths<TPath>) {
	const assetPaths = createAssetOptions(paths);
	const headingLevels = [2, 3, 4, 5] as const;

	return {
		heading: headingLevels,
		image: assetPaths,
	};
}
