import type { Ref } from "$lib/internal/ref.js";
import type { FileOrFolder, FileTree } from "$lib/tree.svelte.js";

export class TabbableIdState {
	readonly #tree: Ref<FileTree>;
	#current?: string = $state.raw();

	constructor(tree: Ref<FileTree>) {
		this.#tree = tree;
	}

	readonly current: string = $derived.by(() => this.#current ?? this.#tree.current.children[0].id);

	set(node: FileOrFolder): void {
		this.#current = node.id;
	}

	clear(): void {
		this.#current = undefined;
	}
}

export class DraggedIdState {
	#current?: string = $state.raw();

	get current(): string | undefined {
		return this.#current;
	}

	set(node: FileOrFolder): void {
		this.#current = node.id;
	}

	clear(): void {
		this.#current = undefined;
	}
}
