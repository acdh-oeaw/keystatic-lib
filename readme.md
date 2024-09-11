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
	export interface Config {
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
