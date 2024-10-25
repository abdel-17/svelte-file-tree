export function getPlatform(): string {
	if ("userAgentData" in navigator) {
		const { platform } = navigator.userAgentData as { platform: string };
		return platform;
	}
	return navigator.platform;
}

/**
 * Returns `true` if the platform is macOS, otherwise `false`.
 */
export function isMac(): boolean {
	return /mac/i.test(getPlatform());
}

export function isModifierKey(event: KeyboardEvent | MouseEvent): boolean {
	if (isMac()) {
		// Usually, Ctrl is the modifier key for keyboard shortcuts,
		// but on macOS, Command is a more natural choice.
		return event.metaKey;
	}
	return event.ctrlKey;
}
