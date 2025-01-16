import { getContext, setContext } from "svelte";

const TreeItemContextKey = Symbol("TreeItemContextKey");

export type TreeItemContext = {
	onEditingChange: (value: boolean) => void;
};

export function getTreeItemContext(): TreeItemContext {
	const context: TreeItemContext | undefined = getContext(TreeItemContextKey);
	if (context === undefined) {
		throw new Error("No parent <TreeItem> found");
	}
	return context;
}

export function setTreeItemContext(context: TreeItemContext): void {
	setContext(TreeItemContextKey, context);
}
