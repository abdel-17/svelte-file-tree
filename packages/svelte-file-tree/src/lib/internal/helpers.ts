/** @link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples */
export function is_control_or_meta(event: KeyboardEvent | MouseEvent) {
	if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
		return event.metaKey;
	}
	return event.ctrlKey;
}

export function noop() {}
