export function isControlOrMeta(event: KeyboardEvent | MouseEvent): boolean {
	const isMac = /mac/i.test(navigator.platform);
	if (isMac) {
		// Usually, Ctrl is the modifier key for keyboard shortcuts,
		// but on macOS, Command is a more natural choice.
		return event.metaKey;
	}
	return event.ctrlKey;
}
