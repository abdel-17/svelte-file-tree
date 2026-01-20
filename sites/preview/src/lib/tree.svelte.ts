export class Node {
	id = crypto.randomUUID();
	name: string;
	children?: Node[];

	constructor(name: string, children?: Node[]) {
		this.name = name;
		this.children = $state(children);
	}

	copy(): Node {
		return new Node(
			this.name,
			this.children?.map((child) => child.copy()),
		);
	}
}
