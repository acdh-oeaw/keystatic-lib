import type { ContentComponent } from "@keystatic/core/content-components";

import type { Locale } from "./config";

export function createComponent<
	TPath extends `/${string}/`,
	TLocale extends Locale,
	TComponent extends ContentComponent,
>(createComponentFactory: (assetPath: TPath, locale: TLocale) => TComponent) {
	return function createComponent(assetPath: TPath, locale: TLocale) {
		return createComponentFactory(assetPath, locale);
	};
}
