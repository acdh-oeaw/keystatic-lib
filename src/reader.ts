import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { serialize } from "node:v8";

import type { Collection, ComponentSchema, Config, Singleton } from "@keystatic/core";
import {
	createReader as createLocalReader,
	type EntryWithResolvedLinkedFiles,
} from "@keystatic/core/reader";
import { createGitHubReader } from "@keystatic/core/reader/github";
import type { MDXModule } from "mdx/types.js";

import type { Locale } from "./config";
import { withI18nPrefix, type WithoutI18nPrefix } from "./with-i18n-prefix";

type GitHubReaderConfig = Parameters<typeof createGitHubReader>[1];

type FileUrl = ReturnType<typeof pathToFileURL>;

type AnyCollection = Collection<Record<string, ComponentSchema>, string>;
type AnySingleton = Singleton<Record<string, ComponentSchema>>;

export interface CollectionEntryResource<
	TCollection extends AnyCollection,
	TKey extends string,
	TMdxContent extends MDXModule,
> {
	collection: TKey;
	id: string;
	md5: string;
	data: EntryWithResolvedLinkedFiles<TCollection>;
	compile: (code: string) => Promise<TMdxContent>;
}

export interface CollectionResource<
	TCollection extends AnyCollection,
	TKey extends string,
	TMdxContent extends MDXModule,
> {
	all: () => Promise<Array<CollectionEntryResource<TCollection, TKey, TMdxContent>>>;
	baseUrl: (id: string) => FileUrl;
	compile: (id: string, code: string) => Promise<TMdxContent>;
	list: () => Promise<Array<string>>;
	read: (id: string) => Promise<CollectionEntryResource<TCollection, TKey, TMdxContent>>;
}

export interface SingletonEntryResource<
	TSingleton extends AnySingleton,
	TKey extends string,
	TMdxContent extends MDXModule,
> {
	singleton: TKey;
	md5: string;
	data: EntryWithResolvedLinkedFiles<TSingleton>;
	compile: (code: string) => Promise<TMdxContent>;
}

export interface SingletonResource<
	TSingleton extends AnySingleton,
	TKey extends string,
	TMdxContent extends MDXModule,
> {
	baseUrl: () => FileUrl;
	compile: (code: string) => Promise<TMdxContent>;
	read: () => Promise<SingletonEntryResource<TSingleton, TKey, TMdxContent>>;
}

export interface Readers<
	TCollections extends Record<string, AnyCollection>,
	TSingletons extends Record<string, AnySingleton>,
	TLocale extends Locale,
	TMdxContent extends MDXModule,
> {
	createCollectionResource: <TKeys extends WithoutI18nPrefix<keyof TCollections & string, TLocale>>(
		name: TKeys,
		locale: TLocale,
	) => CollectionResource<TCollections[`${TLocale}:${TKeys}`], TKeys, TMdxContent>;
	createSingletonResource: <TKeys extends WithoutI18nPrefix<keyof TSingletons & string, TLocale>>(
		name: TKeys,
		locale: TLocale,
	) => SingletonResource<TSingletons[`${TLocale}:${TKeys}`], TKeys, TMdxContent>;
}

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
): Readers<TCollections, TSingletons, TLocale, TMdxContent> {
	function createCollectionResource<
		TKeys extends WithoutI18nPrefix<keyof TCollections & string, TLocale>,
	>(
		name: TKeys,
		locale: TLocale,
	): CollectionResource<TCollections[`${TLocale}:${TKeys}`], TKeys, TMdxContent> {
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
			/**
			 * Typescript cannot prove that keystatic's inferred reader return type equals
			 * `EntryWithResolvedLinkedFiles` while the collection type is still generic.
			 * They are identical once instantiated. Using the exported type keeps emitted
			 * declarations free of keystatic internals.
			 */
			const data = (await collectionReader.readOrThrow(id, {
				resolveLinkedFiles: true,
			})) as EntryWithResolvedLinkedFiles<TCollections[`${TLocale}:${TKeys}`]>;
			const md5 = createHash("md5").update(serialize(data)).digest("hex");

			return {
				collection: name,
				id,
				md5,
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
	>(
		name: TKeys,
		locale: TLocale,
	): SingletonResource<TSingletons[`${TLocale}:${TKeys}`], TKeys, TMdxContent> {
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
			/** @see `createCollectionResource` for why this type assertion is necessary. */
			const data = (await singletonReader.readOrThrow({
				resolveLinkedFiles: true,
			})) as EntryWithResolvedLinkedFiles<TSingletons[`${TLocale}:${TKeys}`]>;
			const md5 = createHash("md5").update(serialize(data)).digest("hex");

			return {
				singleton: name,
				md5,
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
