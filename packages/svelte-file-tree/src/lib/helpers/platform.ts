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

export function isModifierKey(event: KeyboardEvent | MouseEvent) {
	if (isMac()) {
		// Usually, Ctrl is used as a modifier key, but Ctrl + Arrow/Space
		// are default shortcuts on macOS.
		//
		// Command is no good either as Command + Space is the
		// default shortcut for Spotlight.
		//
		// Use the Option key as an alternative.
		return event.altKey;
	}
	return event.ctrlKey;
}
