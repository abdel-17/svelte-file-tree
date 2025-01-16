import type { Ref } from "$lib/internal/ref.js";
import type { FileOrFolder, FileTree } from "$lib/tree.svelte.js";

export class TabbableState {
	readonly #tree: Ref<FileTree>;
	#id?: string = $state.raw();

	constructor(tree: Ref<FileTree>) {
		this.#tree = tree;
	}

	readonly id: string = $derived.by(() => this.#id ?? this.#tree.current.children[0].id);

	set(node: FileOrFolder): void {
		this.#id = node.id;
	}

	clear(): void {
		this.#id = undefined;
	}
}

export class DraggedState {
	#id?: string = $state.raw();

	get id(): string | undefined {
		return this.#id;
	}

	set(node: FileOrFolder): void {
		this.#id = node.id;
	}

	clear(): void {
		this.#id = undefined;
	}
}
