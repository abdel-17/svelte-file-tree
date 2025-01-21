import type { HTMLDivAttributes } from "$lib/internal/types.js";
import type { FileTree } from "$lib/tree.svelte.js";
import type { Snippet } from "svelte";

export declare namespace TreeProps {
	type ItemSnippetParameters = [node: FileTree.Node, index: number, depth: number];

	type RenameChange = {
		id: string;
		oldName: string;
		newName: string;
	};

	type ReorderChange = {
		id: string;
		oldParentId: string | undefined;
		oldIndex: number;
		newParentId: string | undefined;
		newIndex: number;
	};

	type OnTreeChangeArgs =
		| {
				type: "rename";
				change: RenameChange;
		  }
		| {
				type: "reorder";
				changes: ReadonlyArray<ReorderChange>;
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
	item: Snippet<TreeProps.ItemSnippetParameters>;
	element?: HTMLElement | null;
	onTreeChange?: (args: TreeProps.OnTreeChangeArgs) => void;
	onTreeChangeError?: (args: TreeProps.OnTreeChangeErrorArgs) => void;
}
