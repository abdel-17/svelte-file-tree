import type { Ref } from "$lib/internal/ref.js";
import type { FileOrFolder } from "$lib/tree.svelte.js";
import type { TreeItemProps } from "./types.js";

export declare namespace DropPositionState {
	type Props = {
		node: Ref<FileOrFolder>;
	};

	type UpdateArgs = {
		rect: DOMRect;
		clientY: number;
	};
}

export class DropPositionState {
	readonly #node: Ref<FileOrFolder>;
	#current?: TreeItemProps.DropPosition = $state.raw();

	constructor({ node }: DropPositionState.Props) {
		this.#node = node;
	}

	get current(): TreeItemProps.DropPosition | undefined {
		return this.#current;
	}

	update({ rect, clientY }: DropPositionState.UpdateArgs): TreeItemProps.DropPosition {
		const position = getDropPosition(this.#node.current, rect, clientY);
		this.#current = position;
		return position;
	}

	clear(): void {
		this.#current = undefined;
	}
}

function getDropPosition(
	node: FileOrFolder,
	rect: DOMRect,
	clientY: number,
): TreeItemProps.DropPosition {
	switch (node.type) {
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
