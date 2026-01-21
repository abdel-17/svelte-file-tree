export class TreeNode {
	id = crypto.randomUUID();
	name: string;
	children?: TreeNode[];

	constructor(name: string, children?: TreeNode[]) {
		this.name = name;
		this.children = $state(children);
	}

	copy(): TreeNode {
		return new TreeNode(
			this.name,
			this.children?.map((child) => child.copy()),
		);
	}
}
