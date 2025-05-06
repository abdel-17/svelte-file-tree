// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
export function isControlOrMeta(event: KeyboardEvent | MouseEvent) {
	if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
		return event.metaKey;
	}

	return event.ctrlKey;
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
