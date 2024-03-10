export type TreeList<T> = ReadonlyArray<{
	readonly value: T;
	readonly children?: TreeList<T>;
}>;

export type TreeNode<T> = {
	id: string;
	value: T;
	setSize: number;
	positionInSet: number;
	level: number;
	parent?: TreeNode<T>;
	previousSibling?: TreeNode<T>;
	nextSibling?: TreeNode<T>;
	children: TreeNode<T>[];
};

function flattenTreeTo<T>(
	target: TreeNode<T>[],
	tree: TreeList<T>,
	getItemId: (value: T) => string,
	level: number = 1,
	parent?: TreeNode<T>,
): TreeNode<T>[] {
	const nodes: TreeNode<T>[] = Array(tree.length);
	for (let i = 0; i < tree.length; ++i) {
		const { value, children = [] } = tree[i]!;
		const node: TreeNode<T> = {
			id: getItemId(value),
			value,
			setSize: tree.length,
			positionInSet: i + 1,
			level,
			parent,
			children: [],
		};

		nodes[i] = node;
		target.push(node);

		node.children = flattenTreeTo(target, children, getItemId, level + 1, node);

		const previousNode = nodes[i - 1];
		if (previousNode !== undefined) {
			previousNode.nextSibling = node;
			node.previousSibling = previousNode;
		}
	}
	return nodes;
}

export function flattenTree<T>(
	tree: TreeList<T>,
	getItemId: (value: T) => string,
): TreeNode<T>[] {
	const result: TreeNode<T>[] = [];
	flattenTreeTo(result, tree, getItemId);
	return result;
}
