import type { Ref } from "$lib/internal/box.svelte.js";
import type { FileTree } from "$lib/tree.svelte.js";
import type { TreeItemProps } from "./types.js";

export class DropPositionState {
	readonly #node: Ref<FileTree.Node>;
	#current?: TreeItemProps.DropPosition = $state.raw();
	#updateRequestId?: number;

	constructor(node: Ref<FileTree.Node>) {
		this.#node = node;
	}

	get current() {
		return this.#current;
	}

	get(rect: DOMRect, clientY: number) {
		switch (this.#node.current.type) {
			case "file": {
				const midY = rect.top + rect.height / 2;
				return clientY < midY ? "before" : "after";
			}
			case "folder": {
				const { top, bottom, height } = rect;
				if (clientY < top + height / 3) {
					return "before";
				}
				if (clientY < bottom - height / 3) {
					return "inside";
				}
				return "after";
			}
		}
	}

	update(element: HTMLElement, clientY: number) {
		if (this.#updateRequestId !== undefined) {
			return;
		}

		// The dragover event fires at a high rate, so computing
		// the drop position needs to be throttled to avoid jank.
		this.#updateRequestId = window.requestAnimationFrame(() => {
			this.#current = this.get(element.getBoundingClientRect(), clientY);
			this.#updateRequestId = undefined;
		});
	}

	clear() {
		this.#current = undefined;

		if (this.#updateRequestId !== undefined) {
			window.cancelAnimationFrame(this.#updateRequestId);
			this.#updateRequestId = undefined;
		}
	}
}
