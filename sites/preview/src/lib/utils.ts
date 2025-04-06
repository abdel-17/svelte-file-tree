const sizeFormatter = new Intl.NumberFormat(undefined, {
	style: "decimal",
	maximumFractionDigits: 2,
});

export function formatSize(size: number): string {
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
