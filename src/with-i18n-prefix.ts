import type { Locale } from "./config";

export function withI18nPrefix<TLabel extends string, TLocale extends Locale>(
	label: TLabel,
	locale: TLocale,
) {
	return `${locale}:${label}` as const;
}

export type WithoutI18nPrefix<
	T extends string,
	TLocale extends Locale,
> = T extends `${TLocale}:${infer U}` ? U : T;
