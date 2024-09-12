import type { Collection, ComponentSchema, Singleton } from "@keystatic/core";

import type { Locale } from "./config";

export function createCollectionPaths<TPath extends `/${string}/`>(path: TPath, locale: Locale) {
	return {
		assetPath: `/content/${locale}${path}`,
		contentPath: `./content/${locale}${path}*/`,
	} as const;
}

export function createSingletonPaths<TPath extends `/${string}/`>(path: TPath, locale: Locale) {
	return {
		assetPath: `/content/${locale}${path}`,
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
