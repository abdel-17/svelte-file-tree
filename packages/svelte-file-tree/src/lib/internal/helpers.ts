export function isControlOrMeta(event: KeyboardEvent | MouseEvent): boolean {
	// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
	if (navigator.platform.indexOf("Mac") === 0 || navigator.platform === "iPhone") {
		return event.metaKey;
	}
	return event.ctrlKey;
}
