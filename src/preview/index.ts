import { useEffect, useState } from "react";

interface UseObjectUrlParams {
	data: Uint8Array;
	extension: string;
	filename: string;
}

/** @see https://github.com/Thinkmill/keystatic/blob/main/packages/keystatic/src/form/fields/image/ui.tsx#L48-L63 */
export function useObjectUrl(params: UseObjectUrlParams | null) {
	const data = params?.data;
	const contentType = params?.extension === "svg" ? "image/svg+xml" : undefined;

	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (data == null) {
			setUrl(null);
			return undefined;
		}

		const url = URL.createObjectURL(
			new Blob([data], contentType ? { type: contentType } : undefined),
		);
		setUrl(url);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [contentType, data]);

	return url;
}
