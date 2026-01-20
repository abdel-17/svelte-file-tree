export type TreeItemDataProps<T> = {
	id: string;
	elementId: string;
	index: number;
	data: T;
	parent: TreeItemData<T> | undefined;
	parentChildren: T[];
	indexInChildren: number;
	expanded: boolean;
	selected: () => boolean;
	inClipboard: () => boolean;
	disabled: () => boolean;
	hasChildren: () => boolean;
};

export class TreeItemData<T> {
	readonly id: string;
	readonly elementId: string;
	readonly index: number;
	readonly data: T;
	readonly depth: number;
	readonly parent: TreeItemData<T> | undefined;
	readonly parentChildren: T[];
	readonly indexInChildren: number;
	readonly expanded: boolean;
	readonly selected: boolean;
	readonly inClipboard: boolean;
	readonly disabled: boolean;
	readonly hasChildren: boolean;

	constructor(props: TreeItemDataProps<T>) {
		this.id = props.id;
		this.elementId = props.elementId;
		this.index = props.index;
		this.data = props.data;
		this.depth = props.parent === undefined ? 0 : props.parent.depth + 1;
		this.parent = props.parent;
		this.parentChildren = props.parentChildren;
		this.indexInChildren = props.indexInChildren;
		this.expanded = props.expanded;
		this.selected = $derived.by(props.selected);
		this.inClipboard = $derived.by(props.inClipboard);
		this.disabled = $derived.by(props.disabled);
		this.hasChildren = $derived.by(props.hasChildren);
	}

	first(predicate: (item: TreeItemData<T>) => boolean) {
		let item: TreeItemData<T> | undefined = this;
		do {
			if (predicate(item)) {
				break;
			}
			item = item.parent;
		} while (item !== undefined);
		return item;
	}
}
