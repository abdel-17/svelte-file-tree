export class TreeItemData {
	id = crypto.randomUUID();
	name: string;
	children?: TreeItemData[];

	constructor(name: string, children?: TreeItemData[]) {
		this.name = name;
		this.children = $state(children);
	}

	copy(): TreeItemData {
		return new TreeItemData(
			this.name,
			this.children?.map((child) => child.copy()),
		);
	}
}
