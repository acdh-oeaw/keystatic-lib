import type { ContentComponent } from "@keystatic/core/content-components";

import type { Locale } from "./config";
import type { Paths } from "./resources";

export function createComponent<
	TPath extends `/${string}/`,
	TLocale extends Locale,
	TComponents extends Record<string, ContentComponent>,
>(createComponentFactory: (paths: Paths<TPath>, locale: TLocale) => TComponents) {
	return function createComponent(paths: Paths<TPath>, locale: TLocale) {
		return createComponentFactory(paths, locale);
	};
}
