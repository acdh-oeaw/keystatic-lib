import { TextField } from "@keystar/ui/text-field";
import type { FormFieldStoredValue, SlugFormField } from "@keystatic/core";

interface ReadonlySlugFieldProps {
	defaultValue?: string;
	description?: string;
	label: string;
}

function ReadonlySlugField(
	props: ReadonlySlugFieldProps,
): SlugFormField<string, string, string, string> {
	const { defaultValue, description, label } = props;

	return {
		kind: "form",
		formKind: "slug",
		label,
		Input(props) {
			return (
				<TextField {...props} description={description} isReadOnly={true} label={label} />
			);
		},
		defaultValue() {
			return defaultValue ?? "";
		},
		parse(value) {
			return parse(value);
		},
		serialize(value) {
			return { value: value === "" ? undefined : value };
		},
		serializeWithSlug(value) {
			return {
				slug: value,
				value: parse(value),
			};
		},
		validate(value) {
			return validate(value);
		},
		reader: {
			parse(value) {
				return validate(parse(value));
			},
			parseWithSlug(value) {
				return parse(value);
			},
		},
	};
}

function parse(value: FormFieldStoredValue): string {
	if (value === undefined) {
		return "";
	}
	if (typeof value !== "string") {
		throw new Error("Must be a string");
	}
	return value;
}

function validate(value: string): string {
	return value;
}

export const readonlySlug = ReadonlySlugField;
