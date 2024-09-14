import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type { Collection, ComponentSchema, Config, Singleton } from "@keystatic/core";
import { createReader as createLocalReader } from "@keystatic/core/reader";
import { createGitHubReader } from "@keystatic/core/reader/github";
import type { MDXModule } from "mdx/types";

import type { Locale } from "./config";
import { withI18nPrefix, type WithoutI18nPrefix } from "./with-i18n-prefix";

type GitHubReaderConfig = Parameters<typeof createGitHubReader>[1];

export function createReader<
	TCollections extends Record<string, Collection<Record<string, ComponentSchema>, string>>,
	TSingletons extends Record<string, Singleton<Record<string, ComponentSchema>>>,
>(
	config: Config<TCollections, TSingletons>,
	getGitHubReaderConfig?: () => GitHubReaderConfig | null,
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
	TLocale extends Locale,
	TMdxContent extends MDXModule,
>(
	config: Config<TCollections, TSingletons>,
	getMdxContent: (code: string, locale: TLocale, baseUrl: URL) => Promise<TMdxContent>,
) {
	function createCollectionResource<
		TKeys extends WithoutI18nPrefix<keyof TCollections & string, TLocale>,
	>(name: TKeys, locale: TLocale) {
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

	function createSingletonResource<
		TKeys extends WithoutI18nPrefix<keyof TSingletons & string, TLocale>,
	>(name: TKeys, locale: TLocale) {
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
