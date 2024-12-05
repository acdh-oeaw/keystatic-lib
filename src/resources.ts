import type { Collection, ComponentSchema, Singleton } from "@keystatic/core";

import type { Locale } from "./config";

/** @private */
export function createPaths<TPath extends `/${string}/`>(path: TPath, locale: Locale) {
	return {
		assetPath: `/content/assets/${locale}${path}`,
		downloadPath: `/content/downloads/${locale}${path}`,
	} as const;
}

export type Paths<TPath extends `/${string}/`> = ReturnType<typeof createPaths<TPath>>;

export function createCollectionPaths<TPath extends `/${string}/`>(path: TPath, locale: Locale) {
	return {
		...createPaths(path, locale),
		contentPath: `./content/${locale}${path}*/`,
	} as const;
}

export function createSingletonPaths<TPath extends `/${string}/`>(path: TPath, locale: Locale) {
	return {
		...createPaths(path, locale),
		contentPath: `./content/${locale}${path}`,
	} as const;
}

export function createCollection<
	TPath extends `/${string}/`,
	TLocale extends Locale,
	TSchema extends Record<string, ComponentSchema>,
	TSlugField extends string,
>(
	path: TPath,
	createLocalisedCollectionFactory: (
		paths: ReturnType<typeof createCollectionPaths<TPath>>,
		locale: TLocale,
	) => Collection<TSchema, TSlugField>,
) {
	return function createLocalisedCollection(locale: TLocale) {
		const paths = createCollectionPaths(path, locale);
		return createLocalisedCollectionFactory(paths, locale);
	};
}

export function createSingleton<
	TPath extends `/${string}/`,
	TLocale extends Locale,
	TSchema extends Record<string, ComponentSchema>,
>(
	path: TPath,
	createLocalisedSingletonFactory: (
		paths: ReturnType<typeof createSingletonPaths<TPath>>,
		locale: TLocale,
	) => Singleton<TSchema>,
) {
	return function createLocalisedSingleton(locale: TLocale) {
		const paths = createSingletonPaths(path, locale);
		return createLocalisedSingletonFactory(paths, locale);
	};
}
