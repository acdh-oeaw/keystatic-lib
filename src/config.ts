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

export type Locale = KeystaticConfig extends { locales: string }
	? KeystaticConfig["locales"]
	: string;
