import type { ElementDragPayload } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { DEV } from "esm-env";
import { getContext, hasContext, setContext } from "svelte";
import type { DefaultTFolder, FileNode, FolderNode, TreeItemState } from "$lib/tree.svelte.js";

export type TreeItemEvent<TEvent extends Event = Event> = TEvent & {
	currentTarget: HTMLDivElement;
};

export type TreeContext<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> = {
	root: () => TFolder;
	tabbableId: () => string;
	getItemElementId: (itemId: string) => string;
	onFocusIn: (target: TreeItemState<TFile, TFolder>, event: TreeItemEvent<FocusEvent>) => void;
	onKeyDown: (target: TreeItemState<TFile, TFolder>, event: TreeItemEvent<KeyboardEvent>) => void;
	onClick: (target: TreeItemState<TFile, TFolder>, event: TreeItemEvent<MouseEvent>) => void;
	canDrag: (target: TreeItemState<TFile, TFolder>) => boolean;
	onDragStart: (target: TreeItemState<TFile, TFolder>) => void;
	canDrop: (target: TreeItemState<TFile, TFolder>, source: ElementDragPayload) => boolean;
	onDrag: (target: TreeItemState<TFile, TFolder>, source: ElementDragPayload) => void;
	onDragLeave: (target: TreeItemState<TFile, TFolder>, source: ElementDragPayload) => void;
	onDrop: (target: TreeItemState<TFile, TFolder>, source: ElementDragPayload) => void;
	onDestroyItem: (target: TreeItemState<TFile, TFolder>) => void;
};

const CONTEXT_KEY = Symbol("TreeContext");

export function getTreeContext<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
>(): TreeContext<TFile, TFolder> {
	if (DEV && !hasContext(CONTEXT_KEY)) {
		throw new Error("No parent <Tree> found");
	}
	return getContext(CONTEXT_KEY);
}

export function setTreeContext<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
>(context: TreeContext<TFile, TFolder>) {
	setContext(CONTEXT_KEY, context);
}
