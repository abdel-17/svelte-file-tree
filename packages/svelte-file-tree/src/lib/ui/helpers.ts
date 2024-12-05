export function isControlOrMeta(event: KeyboardEvent | MouseEvent) {
	const isMac = /mac/i.test(navigator.platform);
	return isMac ? event.metaKey : event.ctrlKey;
}
