import type { Collection, ComponentSchema, Config, Singleton } from "@keystatic/core";
import type { ContentComponent } from "@keystatic/core/content-components";
import { createReader as createLocalReader } from "@keystatic/core/reader";
import { createGitHubReader } from "@keystatic/core/reader/github";
import slugify from "@sindresorhus/slugify";

/**
 * Provide supported locales by augmenting the interface:
 *
 * ```ts
 * export interface KeystaticConfig {
 *   locales: "de" | "en"
 * }
 * ```
 */
export interface KeystaticConfig {}

type Locale = KeystaticConfig extends { locales: string } ? KeystaticConfig["locales"] : string;

export function createLabel(label: string, locale: Locale) {
	return `${label} (${locale})`;
}

export function createAssetOptions<TPath extends `/${string}/`>(path: TPath) {
	return {
		directory: `./public/assets${path}` as const,
		publicPath: `/assets${path}` as const,
		transformFilename(originalFilename: string) {
			return slugify(originalFilename, { preserveCharacters: ["."] });
		},
	};
}

export function createContentFieldOptions<TPath extends `/${string}/`>(assetPath: TPath) {
	const assetPaths = createAssetOptions(assetPath);
	const headingLevels = [2, 3, 4, 5] as const;

	return {
		heading: headingLevels,
		image: assetPaths,
	};
}

export function createComponent<TPath extends `/${string}/`, TComponent extends ContentComponent>(
	createComponentFactory: (assetPath: TPath, locale: Locale) => TComponent,
) {
	return function createComponent(assetPath: TPath, locale: Locale) {
		return createComponentFactory(assetPath, locale);
	};
}

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
	TSchema extends Record<string, ComponentSchema>,
	TSlugField extends string,
>(
	path: TPath,
	createLocalisedCollectionFactory: (
		paths: ReturnType<typeof createCollectionPaths<TPath>>,
		locale: Locale,
	) => Collection<TSchema, TSlugField>,
) {
	return function createLocalisedCollection(locale: Locale) {
		const paths = createCollectionPaths(path, locale);
		return createLocalisedCollectionFactory(paths, locale);
	};
}

export function createSingleton<
	TPath extends `/${string}/`,
	Schema extends Record<string, ComponentSchema>,
>(
	path: TPath,
	createLocalisedSingletonFactory: (
		paths: ReturnType<typeof createSingletonPaths<TPath>>,
		locale: Locale,
	) => Singleton<Schema>,
) {
	return function createLocalisedSingleton(locale: Locale) {
		const paths = createSingletonPaths(path, locale);
		return createLocalisedSingletonFactory(paths, locale);
	};
}

export function withI18nPrefix<TLabel extends string, TLocale extends Locale>(
	label: TLabel,
	locale: TLocale,
) {
	return `${locale}:${label}` as const;
}

export type WithoutI18nPrefix<T extends string> = T extends `${Locale}:${infer U}` ? U : T;

export function createReader<
	TCollections extends Record<string, Collection<Record<string, ComponentSchema>, string>>,
	TSingletons extends Record<string, Singleton<Record<string, ComponentSchema>>>,
>(
	config: Config<TCollections, TSingletons>,
	getGitHubReaderConfig?: () => {
		repo: `${string}/${string}`;
		pathPrefix?: string;
		ref?: string;
		token?: string;
	} | null,
) {
	const gitHubConfig = getGitHubReaderConfig?.();

	if (gitHubConfig != null) {
		return createGitHubReader(config, gitHubConfig);
	}

	return createLocalReader(process.cwd(), config);
}
