/**
 * Returns `true` if the platform is macOS, otherwise `false`.
 */
export function isMac(): boolean {
	return /mac/i.test(navigator.platform);
}

export function isModifierKey(event: KeyboardEvent | MouseEvent): boolean {
	if (isMac()) {
		// Usually, Ctrl is the modifier key for keyboard shortcuts,
		// but on macOS, Command is a more natural choice.
		return event.metaKey;
	}
	return event.ctrlKey;
}
