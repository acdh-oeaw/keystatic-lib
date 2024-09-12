import type { Locale } from "./config";

export function createLabel(label: string, locale: Locale) {
	return `${label} (${locale})`;
}
