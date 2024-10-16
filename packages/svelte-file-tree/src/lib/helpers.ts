export function composeHandlers<E extends Event>(
	first: (event: E) => void,
	second: ((event: E) => void) | null | undefined,
): (event: E) => void {
	return (event) => {
		first(event);
		second?.(event);
	};
}

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

export const keys = {
	ARROW_UP: "ArrowUp",
	ARROW_DOWN: "ArrowDown",
	ARROW_LEFT: "ArrowLeft",
	ARROW_RIGHT: "ArrowRight",
	PAGE_UP: "PageUp",
	PAGE_DOWN: "PageDown",
	HOME: "Home",
	END: "End",
	SPACE: " ",
	NON_BREAKING_SPACE: "\u00A0",
	ENTER: "Enter",
	ESCAPE: "Escape",
} as const;

export function findElementById(id: string): HTMLElement {
	const element = document.getElementById(id);
	if (element === null) {
		throw new Error(`Element with id "${id}" not found`);
	}
	return element;
}
