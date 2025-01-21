import type { Ref } from "$lib/internal/box.svelte.js";
import type { FileTree, FolderNode } from "$lib/tree.svelte.js";
import { Context } from "runed";
import type { TreeItemProps } from "../TreeItem/types.js";
import type { ClipboardState, DragState, FocusState } from "./state.svelte.js";

export declare namespace TreeContext {
	type Item<TNode extends FileTree.Node = FileTree.Node> = {
		node: TNode;
		index: number;
		parent: ParentItem | undefined;
	};

	type ParentItem = Item<FolderNode>;
}

export const TreeContext = new Context<{
	tree: Ref<FileTree>;
	treeElement: Ref<HTMLElement | null>;
	clipboardState: ClipboardState;
	focusState: FocusState;
	dragState: DragState;
	getChildren: (item: TreeContext.ParentItem | undefined) => FileTree.Node[];
	getNextItem: (item: TreeContext.Item) => TreeContext.Item | undefined;
	getPreviousItem: (item: TreeContext.Item) => TreeContext.Item | undefined;
	selectUntil: (node: FileTree.Node, element: HTMLElement) => void;
	renameItem: (
		node: FileTree.Node,
		name: string,
		parent: TreeContext.ParentItem | undefined,
	) => boolean;
	dropDragged: (
		draggedId: string,
		node: FileTree.Node,
		index: number,
		parent: TreeContext.ParentItem | undefined,
		position: TreeItemProps.DropPosition,
	) => void;
}>("Tree");

export const TreeItemProviderContext = new Context<{
	node: Ref<FileTree.Node>;
	index: Ref<number>;
	depth: Ref<number>;
	parent: Ref<TreeContext.ParentItem | undefined>;
}>("TreeItemProvider");
