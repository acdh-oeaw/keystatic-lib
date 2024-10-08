# keystatic lib

utilities for working with multi-language [`keystatic`](https://keystatic.com) collections.

## how to install

```bash
npm i @acdh-oeaw/keystatic-lib
```

## how to use

provide the languages supported in your project via typescript module augmentation:

```ts
// ./types/keystatic.d.ts

declare module "@acdh-oeaw/keystatic-lib" {
	export interface KeystaticConfig {
		locales: "de" | "en";
	}
}
```

### create components (rich text editor widgets)

```ts
// ./lib/keystatic/components.ts

import { createComponent } from "@acdh-oeaw/keystatic-lib";
import { wrapper } from "@keystatic/core/content-components";

export const Video = createComponent((assetPath, locale) => {
	return wrapper({
		label: "Video",
		schema: {
			/** ... */
		},
	});
});
```

### create collections and singletons

```ts
// ./lib/keystatic/resources.ts

import {
	createAssetOptions,
	createCollection,
	createContentFieldOptions,
	createSingleton,
	createLabel,
} from "@acdh-oeaw/keystatic-lib";
import { collection, singleton } from "@keystatic/core";

import { Video } from "./lib/keystatic/components";

export const pages = createCollection("/pages/", (paths, locale) => {
	return collection({
		label: createLabel("Pages", locale),
		path: paths.contentPath,
		slugField: "title",
		format: { contentField: "content" },
		entryLayout: "content",
		columns: ["title"],
		schema: {
			title: fields.slug({
				name: {
					label: "Title",
					validation: { isRequired: true },
				},
			}),
			image: fields.image({
				label: "Image",
				validation: { isRequired: false },
				...createAssetOptions(paths.assetPath),
			}),
			content: fields.mdx({
				label: "Content",
				options: createContentFieldOptions(paths.assetPath),
				components: {
					Video: Video(paths.assetPath, locale),
				},
			}),
		},
	});
});

export const metadata = createSingleton("/metadata/", (paths, locale) => {
	return singleton({
		label: createLabel("Metadata", locale),
		path: paths.contentPath,
		format: { data: "json" },
		entryLayout: "form",
		schema: {
			/** ... */
		},
	});
});
```

```ts
// ./keystatic.config.ts

import { withI18nPrefix } from "@acdh-oeaw/keystatic-lib";
import { config } from "@keystatic/core";

import { metadata, pages } from "./lib/keystatic/resources";

export default config({
	collections: {
		[withI18nPrefix("pages", "de")]: pages("de"),
		[withI18nPrefix("pages", "en")]: pages("en"),
	},
	singletons: {
		[withI18nPrefix("metadata", "de")]: metadata("de"),
		[withI18nPrefix("metadata", "en")]: metadata("en"),
	},
});
```

### read and render entries

create resource readers by passing the keystatic config and a mdx compiler function to
`createReaders`:

```ts
// ./lib/keystatic/readers.ts

import { createReaders } from "@acdh-oeaw/keystatic-lib/reader";
import { createFormatAwareProcessors } from "@mdx-js/mdx/internal-create-format-aware-processors";

import config from "../../keystatic.config";

function getMdxContent(code: string, locale: Locale, baseUrl: URL) {
	const processor = await createFormatAwareProcessors({
		/** Set this to `html` in astro. */
		// elementAttributeNameCase: "html",
		format: "mdx",
		outputFormat: "function-body",
		providerImportSource: "#",
		/** ... */
	});
	const file = await processor.process(code);
	return run(file, { ...runtime, baseUrl, useMDXComponents });
}

function useMDXComponents() {
	/** Provide component mappings, which should be available to all mdx content. */
	return {
		// a: LocaleLink,
		// Video,
	};
}

const { createCollectionResource, createSingletonResource } = createReaders(config, getMdxContent);

export { createCollectionResource, createSingletonResource };
```

a reader has methods for reading a single resource entry (`read`), reading all resource entries
(`all`), and returning a list of entry identifiers (`list`).

a resource entry returns `id`, `collection`/`singleton`, and `data`, as well as a `compile` method,
which can be used to transform rich-text field content to a jsx component.

#### astro

```astro
---
// ./src/pages/[locale]/[id].astro

import type { GetStaticPathsResult } from "astro";

import { locales } from "@/config/i18n.config";
import Layout from "@/layouts/page-layout.astro";
import { createCollectionResource } from "@/lib/keystatic/readers";

export async function getStaticPaths() {
	return (
		await Promise.all(
			locales.map(async (locale) => {
				const ids = await createCollectionResource("pages", locale).list();
				return ids.map((id) => {
					return { params: { id, locale } };
				});
			}),
		)
	).flat() satisfies GetStaticPathsResult;
}

const { id, locale } = Astro.params;

const page = await createCollectionResource("pages", locale).read(id);
const { content, image, title } = page.data;
const { default: Content } = await page.compile(content);
---

<Layout>
	<main>
		<Content />
	</main>
</Layout>
```

#### next.js

```tsx
// ./app/[locale]/[id]/page.tsx

import type { Locale } from "@/config/i18n.config";
import { createCollectionResource } from "@/lib/keystatic/readers";

interface PageProps {
	params: {
		id: string;
		locale: Locale;
	};
}

export const dynamicParams = false;

export async function generateStaticParams(props: PageProps) {
	const { locale } = props.params;
	const ids = await createCollectionResource("pages", locale).list();
	return ids.map((id) => {
		return { id };
	});
}

export default async function Page(props: PageProps) {
	const { id, locale } = props.params;

	const page = await createCollectionResource("pages", locale).read(id);
	const { title, image, content } = page.data;
	const { default: Content } = await page.compile(content);

	return (
		<main>
			<Content />
		</main>
	);
}
```
