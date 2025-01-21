import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { FileTree } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export declare namespace TreeProps {
	type Reorder = {
		id: string;
		oldParentId: string | undefined;
		oldIndex: number;
		newParentId: string | undefined;
		newIndex: number;
	};

	type OnTreeChangeArgs =
		| {
				type: "rename";
				id: string;
				oldName: string;
				newName: string;
		  }
		| {
				type: "reorder";
				reorders: ReadonlyArray<Reorder>;
		  }
		| {
				type: "delete";
				deleted: ReadonlyArray<string>;
				reorders: ReadonlyArray<Reorder>;
		  };

	type OnTreeChangeErrorArgs =
		| {
				type: "rename:empty";
		  }
		| {
				type: "rename:conflict";
				name: string;
		  };
}

export interface TreeProps
	extends Omit<HTMLDivAttributes, "children" | "role" | "aria-multiselectable"> {
	tree: FileTree;
	item: Snippet<[node: FileTree.Node, index: number, depth: number]>;
	element?: HTMLElement | null;
	onTreeChange?: (args: TreeProps.OnTreeChangeArgs) => void;
	onTreeChangeError?: (args: TreeProps.OnTreeChangeErrorArgs) => void;
}
