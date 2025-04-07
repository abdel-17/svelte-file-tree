import type { EventHandler } from "svelte/elements";

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

export function composeEventHandlers<TEvent extends Event, TTarget extends EventTarget>(
	a: EventHandler<TEvent, TTarget> | null | undefined,
	b: EventHandler<TEvent, TTarget>,
): EventHandler<TEvent, TTarget> {
	return (event) => {
		if (a != null) {
			a(event);

			if (event.defaultPrevented) {
				return;
			}
		}

		b(event);
	};
}
