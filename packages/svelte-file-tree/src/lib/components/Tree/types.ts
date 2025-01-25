import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { FileTree, FolderNode } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export declare namespace TreeProps {
	type InPlaceReorder = {
		node: FileTree.Node;
		oldIndex: number;
		newIndex: number;
	};

	type Reorder = {
		node: FileTree.Node;
		oldParent: FolderNode | undefined;
		oldIndex: number;
		newParent: FolderNode | undefined;
		newIndex: number;
	};

	type OnTreeChangeArgs =
		| {
				type: "rename";
				node: FileTree.Node;
				oldName: string;
				newName: string;
		  }
		| {
				type: "reorder";
				reorders: ReadonlyArray<Reorder>;
		  }
		| {
				type: "delete";
				deleted: ReadonlyArray<FileTree.Node>;
				reorders: ReadonlyArray<InPlaceReorder>;
		  };

	type OnTreeChangeErrorArgs =
		| {
				type: "rename:empty";
				node: FileTree.Node;
		  }
		| {
				type: "rename:conflict";
				node: FileTree.Node;
				name: string;
		  }
		| {
				type: "reorder:circular-reference";
				node: FolderNode;
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
