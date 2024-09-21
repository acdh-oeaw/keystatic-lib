import type { ContentComponent } from "@keystatic/core/content-components";

import type { Locale } from "./config";

export function createComponent<
	TPath extends `/${string}/`,
	TLocale extends Locale,
	TComponents extends Record<string, ContentComponent>,
>(createComponentFactory: (assetPath: TPath, locale: TLocale) => TComponents) {
	return function createComponent(assetPath: TPath, locale: TLocale) {
		return createComponentFactory(assetPath, locale);
	};
}
