import type { Ref } from "$lib/internal/box.svelte.js";
import type { FileTree } from "$lib/tree.svelte.js";

export class ClipboardState {
	#action?: "copy" | "cut";
	#ids: Array<string> = $state([]);

	get action() {
		return this.#action;
	}

	get ids(): ReadonlyArray<string> {
		return this.#ids;
	}

	copy(ids: Set<string>) {
		this.#action = "copy";
		this.#ids = Array.from(ids);
	}

	cut(ids: Set<string>) {
		this.#action = "cut";
		this.#ids = Array.from(ids);
	}

	delete(id: string) {
		const ids = this.#ids;
		for (let i = 0; i < ids.length; i++) {
			if (ids[i] === id) {
				ids.splice(i, 1);
				break;
			}
		}

		if (ids.length === 0) {
			this.#action = undefined;
		}
	}

	clear() {
		this.#action = undefined;
		this.#ids.length = 0;
	}
}

export class FocusState {
	readonly #tree: Ref<FileTree>;
	#tabbableId?: string = $state.raw();

	constructor(tree: Ref<FileTree>) {
		this.#tree = tree;
	}

	readonly tabbableId = $derived.by(() => this.#tabbableId ?? this.#tree.current.children[0].id);

	setTabbable(node: FileTree.Node) {
		this.#tabbableId = node.id;
	}

	clearTabbable() {
		this.#tabbableId = undefined;
	}
}

export class DragState {
	#draggedId?: string = $state.raw();

	get draggedId() {
		return this.#draggedId;
	}

	setDragged(node: FileTree.Node) {
		this.#draggedId = node.id;
	}

	clearDragged() {
		this.#draggedId = undefined;
	}
}
