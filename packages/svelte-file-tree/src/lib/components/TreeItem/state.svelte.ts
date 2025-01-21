import type { Ref } from "$lib/internal/box.svelte.js";
import type { FileTree } from "$lib/tree.svelte.js";
import type { TreeItemProps } from "./types.js";

export class DropPositionState {
	readonly #node: Ref<FileTree.Node>;
	#current?: TreeItemProps.DropPosition = $state.raw();

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

	update(rect: DOMRect, clientY: number) {
		const position = this.get(rect, clientY);
		this.#current = position;
		return position;
	}

	clear() {
		this.#current = undefined;
	}
}
