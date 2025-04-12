const sizeFormatter = new Intl.NumberFormat(undefined, {
	style: "decimal",
	maximumFractionDigits: 2,
});

export function formatSize(size: number) {
	if (size < 1000) {
		return sizeFormatter.format(size) + " B";
	}

	size /= 1000;
	if (size < 1000) {
		return sizeFormatter.format(size) + " KB";
	}

	size /= 1000;
	if (size < 1000) {
		return sizeFormatter.format(size) + " MB";
	}

	size /= 1000;
	if (size < 1000) {
		return sizeFormatter.format(size) + " GB";
	}

	size /= 1000;
	return sizeFormatter.format(size) + " TB";
}

export function composeEventHandlers<TEvent extends Event>(
	a: ((event: TEvent) => void) | null | undefined,
	b: (event: TEvent) => void,
) {
	return (event: TEvent) => {
		if (a != null) {
			a(event);

			if (event.defaultPrevented) {
				return;
			}
		}

		b(event);
	};
}
