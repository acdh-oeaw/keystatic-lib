/**
 * Type-level consumer fixture.
 *
 * Imports the package by name, so it resolves through the `exports` map to the built `dist`
 * declarations, and is checked with `skipLibCheck: false` to catch declarations which reference
 * undeclared types.
 */

import "@acdh-oeaw/keystatic-lib";
import "@acdh-oeaw/keystatic-lib/fields/color-picker";
import "@acdh-oeaw/keystatic-lib/fields/readonly";
import "@acdh-oeaw/keystatic-lib/fields/readonly-slug";
import "@acdh-oeaw/keystatic-lib/preview";

import type { pathToFileURL } from "node:url";

import { createReaders } from "@acdh-oeaw/keystatic-lib/reader";
import { collection, config, fields, singleton } from "@keystatic/core";

/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
type Equals<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

function assertType<T extends true>(_value?: T): void {
	/** Type-level only. */
}
/* eslint-enable @typescript-eslint/no-unnecessary-type-parameters */

const keystaticConfig = config({
	storage: { kind: "local" },
	collections: {
		"en:posts": collection({
			label: "Posts",
			path: "./content/en/posts/*/",
			slugField: "title",
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				summary: fields.text({ label: "Summary" }),
			},
		}),
	},
	singletons: {
		"en:metadata": singleton({
			label: "Metadata",
			path: "./content/en/metadata/",
			schema: {
				title: fields.text({ label: "Title" }),
			},
		}),
	},
});

const { createCollectionResource, createSingletonResource } = createReaders(
	keystaticConfig,
	(_code: string, _locale: "en", _baseUrl: URL) => {
		return Promise.resolve({ default: () => null });
	},
);

export async function check(): Promise<void> {
	const posts = createCollectionResource("posts", "en");

	const entries = await posts.all();
	const _entry = entries[0]!;

	assertType<Equals<typeof _entry.collection, "posts">>();
	assertType<Equals<typeof _entry.id, string>>();
	/** Slug field maps to its serialized value. */
	assertType<Equals<typeof _entry.data.title, string>>();
	assertType<Equals<typeof _entry.data.summary, string>>();

	const _post = await posts.read("first-post");
	assertType<Equals<typeof _post.data.title, string>>();
	assertType<Equals<typeof _post.data, typeof _entry.data>>();

	assertType<Equals<Awaited<ReturnType<typeof posts.list>>, Array<string>>>();
	assertType<Equals<ReturnType<typeof posts.baseUrl>, ReturnType<typeof pathToFileURL>>>();

	const _metadata = await createSingletonResource("metadata", "en").read();
	assertType<Equals<typeof _metadata.singleton, "metadata">>();
	assertType<Equals<typeof _metadata.data.title, string>>();
}
