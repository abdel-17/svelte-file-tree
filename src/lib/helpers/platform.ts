export function getPlatform() {
	if ("userAgentData" in navigator) {
		const { platform } = navigator.userAgentData as { platform: string };
		return platform;
	}
	return navigator.platform;
}

/**
 * Returns `true` if the platform is macOS, otherwise `false`.
 */
export function isMac() {
	return /mac/i.test(getPlatform());
}

/**
 * If the platform is macOS, returns `event.metaKey`,
 * otherwise, returns `event.ctrlKey`.
 */
export function isCmdOrCtrlKey(
	event: KeyboardEvent | PointerEvent | MouseEvent,
) {
	return isMac() ? event.metaKey : event.ctrlKey;
}
