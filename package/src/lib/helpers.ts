export function get_closest_treeitem(element: unknown): HTMLDivElement | null {
	if (element instanceof Element) {
		return element.closest("div[role=treeitem]");
	}
	return null;
}

export function is_treeitem(element: unknown): element is HTMLDivElement {
	return element instanceof HTMLDivElement && element.role === "treeitem";
}

/** @link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples */
export function is_control_or_meta(event: KeyboardEvent | MouseEvent): boolean {
	if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
		return event.metaKey;
	}
	return event.ctrlKey;
}

export function set_toggle(ids: Set<string>, id: string): void {
	const deleted = ids.delete(id);
	if (!deleted) {
		ids.add(id);
	}
}
