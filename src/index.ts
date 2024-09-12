import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { Collection, ComponentSchema, Config, Singleton } from "@keystatic/core";
import type { ContentComponent } from "@keystatic/core/content-components";
import { createReader as createLocalReader } from "@keystatic/core/reader";
import { createGitHubReader } from "@keystatic/core/reader/github";
import slugify from "@sindresorhus/slugify";
import type { MDXModule } from "mdx/types";

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

export function withI18nPrefix<TLabel extends string>(label: TLabel, locale: Locale) {
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

export function createReaders<
	TCollections extends Record<string, Collection<Record<string, ComponentSchema>, string>>,
	TSingletons extends Record<string, Singleton<Record<string, ComponentSchema>>>,
	TMdxContent extends MDXModule,
>(
	config: Config<TCollections, TSingletons>,
	getMdxContent: (code: string, locale: Locale, baseUrl: URL) => Promise<TMdxContent>,
) {
	function createCollectionResource<TKeys extends WithoutI18nPrefix<keyof TCollections & string>>(
		name: TKeys,
		locale: Locale,
	) {
		const reader = createReader(config);
		const collectionName = withI18nPrefix(name, locale);

		const collectionReader = reader.collections[collectionName];
		const collectionConfig = reader.config.collections?.[collectionName];

		assert(collectionConfig?.path);

		function baseUrl(id: string) {
			return pathToFileURL(join(process.cwd(), collectionConfig!.path!.replace(/\*+/, id)));
		}

		async function compile(id: string, code: string) {
			return getMdxContent(code, locale, baseUrl(id));
		}

		function list() {
			return collectionReader.list();
		}

		async function read(id: string) {
			const data = await collectionReader.readOrThrow(id, { resolveLinkedFiles: true });

			return {
				collection: name,
				id,
				data,
				compile(code: string) {
					return compile(id, code);
				},
			};
		}

		async function all() {
			const ids = await list();

			return Promise.all(ids.map(read));
		}

		return {
			all,
			baseUrl,
			compile,
			list,
			read,
		};
	}

	function createSingletonResource<TKeys extends WithoutI18nPrefix<keyof TSingletons & string>>(
		name: TKeys,
		locale: Locale,
	) {
		const reader = createReader(config);
		const i18nName = withI18nPrefix(name, locale);

		const singletonReader = reader.singletons[i18nName];
		const singletonConfig = reader.config.singletons?.[i18nName];

		assert(singletonConfig?.path);

		function baseUrl() {
			return pathToFileURL(join(process.cwd(), singletonConfig!.path!));
		}

		async function compile(code: string) {
			return getMdxContent(code, locale, baseUrl());
		}

		async function read() {
			const data = await singletonReader.readOrThrow({ resolveLinkedFiles: true });

			return {
				singleton: name,
				data,
				compile,
			};
		}

		return {
			baseUrl,
			compile,
			read,
		};
	}

	return {
		createCollectionResource,
		createSingletonResource,
	};
}
