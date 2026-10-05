export function get_nearest_treeitem(element: unknown): HTMLElement | null {
	if (element instanceof Element) {
		const treeitem = element.closest("[role=treeitem]");
		if (treeitem instanceof HTMLElement) {
			return treeitem;
		}
	}
	return null;
}

export function is_treeitem(element: unknown): element is HTMLElement {
	return element instanceof HTMLElement && element.role === "treeitem";
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
