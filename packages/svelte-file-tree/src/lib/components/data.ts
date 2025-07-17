import type { DefaultTFolder, FileNode, FolderNode, TreeItemState } from "$lib/tree.svelte.js";

export class DragData<
	TFile extends FileNode = FileNode,
	TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>,
> {
	[key: PropertyKey]: unknown;

	constructor(readonly item: () => TreeItemState<TFile, TFolder>) {}
}
