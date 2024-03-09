export type Tree<T> = {
	readonly value: T;
	readonly children?: ReadonlyArray<Tree<T>>;
};

export type TreeNode<T> = {
	parent?: TreeNode<T>;
	value: T;
	setSize: number;
	positionInSet: number;
	level: number;
	children: TreeNode<T>[];
};

function flattenTreeTo<T>(
	target: TreeNode<T>[],
	item: Tree<T>,
	setSize: number,
	positionInSet: number,
	level: number,
	parent?: TreeNode<T>,
): TreeNode<T> {
	const { value, children = [] } = item;

	const node: TreeNode<T> = {
		parent,
		value,
		setSize,
		positionInSet,
		level,
		children: Array(children.length),
	};

	target.push(node);

	for (let i = 0; i < children.length; ++i) {
		node.children[i] = flattenTreeTo(
			target,
			children[i]!,
			children.length,
			i + 1,
			level + 1,
			node,
		);
	}

	return node;
}

export function flattenTree<T>(
	...roots: ReadonlyArray<Tree<T>>
): TreeNode<T>[] {
	const result: TreeNode<T>[] = [];
	for (let i = 0; i < roots.length; ++i) {
		flattenTreeTo(result, roots[i]!, roots.length, i + 1, 1);
	}
	return result;
}
