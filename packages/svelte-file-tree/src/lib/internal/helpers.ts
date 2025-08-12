/** @link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples */
export function isControlOrMeta(event: KeyboardEvent | MouseEvent) {
	if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
		return event.metaKey;
	}
	return event.ctrlKey;
}

export function noop() {}

export function falsePredicate() {
	return false;
}

export function truePredicate() {
	return true;
}
