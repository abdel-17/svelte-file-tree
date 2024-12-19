import type { FileTreeNode, FolderNode } from "$lib/tree.svelte.js";
import { flushSync, getContext, setContext } from "svelte";
import type { TreeCallbacks, TreeItemDropPosition } from "./types.js";

export interface EnumeratedTreeItem {
	node: FileTreeNode;
	index: number;
}

export interface TreeStateProps {
	getElementId: () => string;
	callbacks: TreeCallbacks;
}

export class TreeState {
	readonly getElementId: () => string;
	readonly callbacks: TreeCallbacks;
	readonly items = new Map<string, EnumeratedTreeItem>();
	tabbableId?: string = $state.raw();
	draggedId?: string = $state.raw();

	constructor(props: TreeStateProps) {
		this.getElementId = props.getElementId;
		this.callbacks = props.callbacks;
	}

	getElement(): HTMLElement | null {
		return document.getElementById(this.getElementId());
	}

	getItemElementId(node: FileTreeNode): string {
		return `${this.getElementId()}:${node.id}`;
	}

	getItemElement(node: FileTreeNode): HTMLElement | null {
		return document.getElementById(this.getItemElementId(node));
	}

	getNextItem(current: EnumeratedTreeItem): EnumeratedTreeItem | undefined {
		let { node, index } = current;
		if (node.type === "folder" && node.expanded && node.children.length !== 0) {
			node = node.children[0];
			index = 0;
			return { node, index };
		}

		while (true) {
			if (index !== node.siblings.length - 1) {
				index++;
				node = node.siblings[index];
				break;
			}

			if (node.parent === undefined) {
				return;
			}

			node = node.parent;
			index = this.items.get(node.id)!.index;
		}
		return { node, index };
	}

	getPreviousItem(current: EnumeratedTreeItem): EnumeratedTreeItem | undefined {
		let { node, index } = current;
		if (index === 0) {
			if (node.parent === undefined) {
				return;
			}

			node = node.parent;
			index = this.items.get(node.id)!.index;
			return { node, index };
		}

		index--;
		node = node.siblings[index];
		while (node.type === "folder" && node.expanded && node.children.length !== 0) {
			index = node.children.length - 1;
			node = node.children[index];
		}
		return { node, index };
	}
}

export interface TreeItemContextProps {
	getNode: () => FileTreeNode;
	getIndex: () => number;
}

export class TreeItemContext {
	static readonly #key = Symbol("TreeItemContext");

	static get(): TreeItemContext {
		const context: TreeItemContext | undefined = getContext(this.#key);
		if (context === undefined) {
			throw new Error("No parent <Tree> found");
		}
		return context;
	}

	static set(treeState: TreeState, props: TreeItemContextProps): TreeItemContext {
		const context = new TreeItemContext(treeState, props);
		setContext(this.#key, context);

		$effect(() => {
			const node = context.getNode();
			const index = context.getIndex();
			treeState.items.set(node.id, { node, index });
		});

		$effect(() => {
			return () => {
				const node = context.getNode();
				treeState.items.delete(node.id);

				if (treeState.tabbableId === node.id) {
					treeState.tabbableId = undefined;
				}

				if (treeState.draggedId === node.id) {
					treeState.draggedId = undefined;
				}
			};
		});

		return context;
	}

	readonly #treeState: TreeState;
	readonly getNode: () => FileTreeNode;
	readonly getIndex: () => number;
	#editing: boolean = $state.raw(false);
	#dropPosition?: TreeItemDropPosition = $state.raw();

	private constructor(treeState: TreeState, props: TreeItemContextProps) {
		this.#treeState = treeState;
		this.getNode = props.getNode;
		this.getIndex = props.getIndex;
	}

	get editing(): boolean {
		return this.#editing;
	}

	get dropPosition(): TreeItemDropPosition | undefined {
		return this.#dropPosition;
	}

	getElementId(): string {
		return this.#treeState.getItemElementId(this.getNode());
	}

	getAriaSelected(): boolean {
		return this.getNode().selected;
	}

	getAriaExpanded(): boolean | undefined {
		const node = this.getNode();
		return node.type === "folder" ? node.expanded : undefined;
	}

	getAriaLevel(): number {
		return this.getNode().depth + 1;
	}

	getAriaPosInSet(): number {
		return this.getIndex() + 1;
	}

	getAriaSetSize(): number {
		return this.getNode().siblings.length;
	}

	getTabIndex(): 0 | -1 {
		const node = this.getNode();
		const { tabbableId = node.tree.nodes[0].id } = this.#treeState;
		return tabbableId === node.id ? 0 : -1;
	}

	onFocusIn(): void {
		this.#treeState.tabbableId = this.getNode().id;
	}

	onArrowRightKeyDown(): void {
		const node = this.getNode();
		if (node.type === "file") {
			return;
		}

		if (!node.expanded) {
			node.tree.expanded.add(node.id);
		} else if (node.children.length !== 0) {
			this.#treeState.getItemElement(node.children[0])?.focus();
		}
	}

	onArrowLeftKeyDown(): void {
		const node = this.getNode();
		if (node.type === "folder" && node.expanded) {
			node.tree.expanded.delete(node.id);
		} else if (node.parent !== undefined) {
			this.#treeState.getItemElement(node.parent)?.focus();
		}
	}

	onArrowUpOrDownKeyDown({ down, shift }: { down: boolean; shift: boolean }): void {
		const treeState = this.#treeState;
		const node = this.getNode();
		const index = this.getIndex();

		const current = { node, index };
		const next = down ? treeState.getNextItem(current) : treeState.getPreviousItem(current);
		if (next === undefined) {
			return;
		}

		const nextElement = treeState.getItemElement(next.node);
		if (nextElement === null) {
			return;
		}

		if (shift) {
			node.tree.selected.add(node.id).add(next.node.id);
		}

		nextElement.focus();
	}

	onPageUpOrDownKeyDown({
		element,
		down,
		shift,
	}: {
		element: HTMLElement;
		down: boolean;
		shift: boolean;
	}): void {
		const treeState = this.#treeState;
		const node = this.getNode();
		const index = this.getIndex();
		const { tree } = node;

		const maxScrollDistance = Math.min(
			treeState.getElement()!.clientHeight,
			document.documentElement.clientHeight,
		);
		const itemRect = element.getBoundingClientRect();
		let current = { node, index };
		let currentElement = element;
		while (true) {
			const next = down ? treeState.getNextItem(current) : treeState.getPreviousItem(current);
			if (next === undefined) {
				break;
			}

			const nextElement = treeState.getItemElement(next.node);
			if (nextElement === null) {
				break;
			}

			const nextRect = nextElement.getBoundingClientRect();
			const distance = Math.abs(nextRect.top - itemRect.top);
			if (distance > maxScrollDistance) {
				break;
			}

			if (shift) {
				tree.selected.add(current.node.id);
			}

			current = next;
			currentElement = nextElement;
		}

		if (current.node === node) {
			return;
		}

		if (shift) {
			tree.selected.add(current.node.id);
		}

		currentElement.focus();
	}

	onHomeKeyDown({ shift, ctrlOrMeta }: { shift: boolean; ctrlOrMeta: boolean }): void {
		const node = this.getNode();
		const { tree } = node;

		const first = tree.nodes[0];
		if (first === node) {
			return;
		}

		const treeState = this.#treeState;
		const firstElement = treeState.getItemElement(first);
		if (firstElement === null) {
			return;
		}

		if (shift && ctrlOrMeta) {
			const index = this.getIndex();
			let current: EnumeratedTreeItem | undefined = { node, index };
			do {
				tree.selected.add(current.node.id);
				current = treeState.getPreviousItem(current);
			} while (current !== undefined);
		}

		firstElement.focus();
	}

	onEndKeyDown({ shift, ctrlOrMeta }: { shift: boolean; ctrlOrMeta: boolean }): void {
		const node = this.getNode();
		const { tree } = node;

		let last = tree.nodes[tree.nodes.length - 1];
		while (last.type === "folder" && last.expanded && last.children.length !== 0) {
			last = last.children[last.children.length - 1];
		}

		if (last === node) {
			return;
		}

		const treeState = this.#treeState;
		const lastElement = treeState.getItemElement(last);
		if (lastElement === null) {
			return;
		}

		if (shift && ctrlOrMeta) {
			const index = this.getIndex();
			let current: EnumeratedTreeItem | undefined = { node, index };
			do {
				tree.selected.add(current.node.id);
				current = treeState.getNextItem(current);
			} while (current !== undefined);
		}

		lastElement.focus();
	}

	onSpaceKeyDown({ element, shift }: { element: HTMLElement; shift: boolean }): void {
		if (shift) {
			this.#onBatchSelect(element);
		} else {
			this.#onToggleSelected();
		}
	}

	#onBatchSelect(element: HTMLElement): void {
		const treeState = this.#treeState;
		const node = this.getNode();
		const { tree } = node;

		let lastSelected: EnumeratedTreeItem | undefined;
		for (const id of tree.selected) {
			const item = treeState.items.get(id);
			if (item !== undefined) {
				lastSelected = item;
			}
		}

		if (lastSelected === undefined) {
			let current: EnumeratedTreeItem | undefined = { node: tree.nodes[0], index: 0 };
			do {
				tree.selected.add(current.node.id);
				if (current.node === node) {
					break;
				}
				current = treeState.getNextItem(current);
			} while (current !== undefined);
			return;
		}

		const lastSelectedElement = treeState.getItemElement(lastSelected.node);
		if (lastSelectedElement === null) {
			return;
		}

		const positionBitmask = lastSelectedElement.compareDocumentPosition(element);
		const following = positionBitmask & Node.DOCUMENT_POSITION_FOLLOWING;
		let current: EnumeratedTreeItem | undefined = lastSelected;
		while (current.node !== node) {
			current = following ? treeState.getNextItem(current) : treeState.getPreviousItem(current);
			if (current === undefined) {
				break;
			}
			tree.selected.add(current.node.id);
		}
	}

	#onToggleSelected(): void {
		const node = this.getNode();
		if (node.selected) {
			node.tree.selected.delete(node.id);
		} else {
			node.tree.selected.add(node.id);
		}
	}

	onEscapeKeyDown(): void {
		const { tree } = this.getNode();
		tree.selected.clear();
		tree.copied.clear();
	}

	onAsteriskKeyDown({ element }: { element: HTMLElement }): void {
		const node = this.getNode();
		const { tree } = node;

		for (const sibling of node.siblings) {
			if (sibling.type === "folder") {
				tree.expanded.add(sibling.id);
			}
		}

		// After the sibling items are expanded, the tree's height changes,
		// causing layout shift. Preserve the scroll position relative to
		// the current item to avoid disorienting the user.
		const rectBefore = element.getBoundingClientRect();
		flushSync();
		const rectAfter = element.getBoundingClientRect();
		window.scrollBy(0, rectAfter.top - rectBefore.top);
	}

	onF2KeyDown({ editable }: { editable: boolean }): void {
		if (!editable) {
			return;
		}

		this.#editing = true;
	}

	onDeleteKeyDown(): void {
		const treeState = this.#treeState;
		const node = this.getNode();
		const { tree } = node;

		// Collect the unique parents of the remaining selected items to delete
		// the their children in one operation. If, instead, we delete each item
		// individually, it would be very inefficient because a potentially large
		// portion of the array is repeatedly left-shifted.
		//
		// For example:
		// 1 2 3 4 5 ...
		//
		// Let's say 1 and 3 are selected. First, we delete 1, which shifts the
		// entire array to the left.
		//   2 3 4 5 ...
		// 2 3 4 5 ...
		//
		// Then we delete 3, which shifts most of the array to the left, AGAIN.
		// 2   4 5 ...
		// 2 4 5 ...
		const deletedNodes: FileTreeNode[] = [];
		const parentsOfDeleted = new Set<FolderNode | undefined>();
		for (const id of tree.selected) {
			const current = treeState.items.get(id)?.node;
			if (current === undefined) {
				continue;
			}

			// Don't delete an item twice. If an ancestor is selected,
			// its entire subtree will also be deleted.
			let hasSelectedAncestor = false;
			{
				let ancestor = current.parent;
				while (ancestor !== undefined) {
					if (ancestor.selected) {
						hasSelectedAncestor = true;
						break;
					}
					ancestor = ancestor.parent;
				}
			}

			if (hasSelectedAncestor) {
				continue;
			}

			deletedNodes.push(current);
			parentsOfDeleted.add(current.parent);
		}

		if (deletedNodes.length === 0) {
			return;
		}

		const index = this.getIndex();
		let focusTarget: EnumeratedTreeItem | undefined = { node, index };
		while (true) {
			let nearestUnselected: EnumeratedTreeItem | undefined = focusTarget;
			while (nearestUnselected !== undefined && nearestUnselected.node.selected) {
				// The current item will be deleted, so we shouldn't traverse its children.
				tree.expanded.delete(nearestUnselected.node.id);
				nearestUnselected = treeState.getNextItem(nearestUnselected);
			}

			if (nearestUnselected === undefined) {
				nearestUnselected = focusTarget;
				while (nearestUnselected !== undefined && nearestUnselected.node.selected) {
					nearestUnselected = treeState.getPreviousItem(nearestUnselected);
				}
			}

			focusTarget = nearestUnselected;
			if (focusTarget === undefined) {
				break;
			}

			// If an item is not selected but one of its ancestors is, it will be deleted.
			let selectedAncestor: FolderNode | undefined;
			{
				let ancestor = focusTarget.node.parent;
				while (ancestor !== undefined) {
					if (ancestor.selected) {
						selectedAncestor = ancestor;
					}
					ancestor = ancestor.parent;
				}
			}

			if (selectedAncestor === undefined) {
				break;
			}

			focusTarget = {
				node: selectedAncestor,
				index: treeState.items.get(selectedAncestor.id)!.index,
			};
		}

		for (const parent of parentsOfDeleted) {
			if (parent === undefined) {
				tree.nodes = tree.nodes.filter((node) => !node.selected);
			} else {
				parent.children = parent.children.filter((child) => !child.selected);
			}
		}

		if (focusTarget !== undefined) {
			treeState.getItemElement(focusTarget.node)?.focus();
		}

		tree.onDelete(deletedNodes);
		treeState.callbacks.onDeleteItems(deletedNodes);
	}

	onAKeyDown({ ctrlOrMeta }: { ctrlOrMeta: boolean }): void {
		if (!ctrlOrMeta) {
			return;
		}

		const { tree } = this.getNode();
		selectAll(tree.nodes, tree.selected);
	}

	onCKeyDown({ ctrlOrMeta }: { ctrlOrMeta: boolean }): void {
		if (!ctrlOrMeta) {
			return;
		}

		const { tree } = this.getNode();
		tree.copied.clear();
		for (const id of tree.selected) {
			tree.copied.add(id);
		}
	}

	onVKeyDown({ ctrlOrMeta }: { ctrlOrMeta: boolean }): void {
		if (!ctrlOrMeta) {
			return;
		}

		const treeState = this.#treeState;
		const node = this.getNode();
		const { tree } = node;

		const shouldPasteInside = node.type === "folder" && node.expanded;
		const pastedNodes: FileTreeNode[] = [];
		for (const id of tree.copied) {
			const current = treeState.items.get(id)?.node;
			if (current === undefined) {
				continue;
			}

			// Don't paste an item twice. If an ancestor is copied,
			// its entire subtree will also be pasted.
			let hasCopiedAncestor = false;
			{
				let ancestor = current.parent;
				while (ancestor !== undefined) {
					if (ancestor.copied) {
						hasCopiedAncestor = true;
						break;
					}
					ancestor = ancestor.parent;
				}
			}

			if (hasCopiedAncestor) {
				continue;
			}

			const pasted = cloneNode(current);
			pasted.parent = shouldPasteInside ? node : node.parent;
			pastedNodes.push(pasted);
		}

		if (pastedNodes.length === 0) {
			return;
		}

		const pastedSiblings = shouldPasteInside ? node.children : node.siblings;
		const uniqueNames = new Set<string>();
		for (const sibling of pastedSiblings) {
			uniqueNames.add(sibling.name);
		}

		for (const pasted of pastedNodes) {
			let i = 1;
			let { name } = pasted;
			while (uniqueNames.has(name)) {
				i++;
				name = `${pasted.name} (${i})`;
			}
			pasted.name = name;
			uniqueNames.add(name);
		}

		let pastedIndex: number;
		if (shouldPasteInside) {
			pastedIndex = pastedSiblings.length;
			pastedSiblings.push(...pastedNodes);
		} else {
			pastedIndex = this.getIndex() + 1;
			pastedSiblings.splice(pastedIndex, 0, ...pastedNodes);
		}

		tree.copied.clear();
		treeState.callbacks.onInsertItems(pastedSiblings, pastedIndex, pastedNodes.length);
	}

	onClick({
		element,
		shift,
		ctrlOrMeta,
	}: {
		element: HTMLElement;
		shift: boolean;
		ctrlOrMeta: boolean;
	}): void {
		if (ctrlOrMeta) {
			this.#onToggleSelected();
		} else if (shift) {
			this.#onBatchSelect(element);
		} else {
			const node = this.getNode();
			const { tree } = node;
			tree.selected.clear();
			tree.selected.add(node.id);
		}
	}

	onDragStart(): void {
		this.#treeState.draggedId = this.getNode().id;
	}

	onDragEnter({ element, clientY }: { element: HTMLElement; clientY: number }): boolean {
		const treeState = this.#treeState;
		if (treeState.draggedId === undefined) {
			return false;
		}

		const node = this.getNode();
		let draggedOrHasDraggedAncestor = false;
		{
			let current: FileTreeNode | undefined = node;
			do {
				if (treeState.draggedId === current.id) {
					draggedOrHasDraggedAncestor = true;
					break;
				}
				current = current.parent;
			} while (current !== undefined);
		}

		// An item cannot be dropped inside itself.
		if (draggedOrHasDraggedAncestor) {
			return false;
		}

		this.#dropPosition = getDropPosition(node, element.getBoundingClientRect(), clientY);
		return true;
	}

	// The dragover event fires at a high rate, so computing
	// the drop position needs to be throttled to avoid jank.
	#dragOverThrottled = false;

	onDragOver({ element, clientY }: { element: HTMLElement; clientY: number }): boolean {
		if (this.#dropPosition === undefined) {
			return false;
		}

		if (!this.#dragOverThrottled) {
			this.#dragOverThrottled = true;
			window.requestAnimationFrame(() => {
				if (this.#dropPosition !== undefined) {
					this.#dropPosition = getDropPosition(
						this.getNode(),
						element.getBoundingClientRect(),
						clientY,
					);
				}
				this.#dragOverThrottled = false;
			});
		}

		return true;
	}

	onDragLeave({ element, to }: { element: HTMLElement; to: EventTarget | null }): void {
		if (to instanceof Node && element.contains(to)) {
			return;
		}

		this.#dropPosition = undefined;
	}

	onDrop({ element, clientY }: { element: HTMLElement; clientY: number }): void {
		// TODO: dnd multiple items at once
		const treeState = this.#treeState;
		if (treeState.draggedId === undefined) {
			return;
		}

		const node = this.getNode();
		const { node: dragged, index: draggedIndex } = treeState.items.get(treeState.draggedId)!;

		if (node === dragged) {
			throw new Error("Cannot drop an item onto itself");
		}

		const dropPosition = getDropPosition(node, element.getBoundingClientRect(), clientY);
		this.#dropPosition = undefined;

		let dropIndex: number;
		switch (dropPosition) {
			case "before":
			case "after": {
				const index = this.getIndex();
				if (dragged.parent !== node.parent) {
					dragged.siblings.splice(draggedIndex, 1);
					dragged.parent = node.parent;
					dropIndex = dropPosition === "before" ? index : index + 1;
					node.siblings.splice(dropIndex, 0, dragged);

					// The dragged item is removed temporarily from the DOM, so it loses focus.
					flushSync();
					treeState.getItemElement(dragged)?.focus();
				} else if (draggedIndex < index) {
					// Instead of removing the dragged item and inserting it back to the
					// same array, we can repeatedly swap it with its adjacent sibling
					// until it reaches the new index, which is more efficient.
					//
					// Case 1: Swap right
					// 1 - 2 - 3 - 4 - 5
					// ^             *
					// 2 - 1 - 3 - 4 - 5
					// 2 - 3 - 1 - 4 - 5
					// 2 - 3 - 4 - 1 - 5
					dropIndex = dropPosition === "before" ? index - 1 : index;
					for (let i = draggedIndex; i < dropIndex; i++) {
						node.siblings[i] = node.siblings[i + 1];
						node.siblings[i + 1] = dragged;
					}
				} else {
					// Case 2: Swap left
					// 1 - 2 - 3 - 4 - 5
					//   *         ^
					// 1 - 2 - 4 - 3 - 5
					// 1 - 4 - 2 - 3 - 5
					dropIndex = dropPosition === "before" ? index : index + 1;
					for (let i = draggedIndex; i > dropIndex; i--) {
						node.siblings[i] = node.siblings[i - 1];
						node.siblings[i - 1] = dragged;
					}
				}
				break;
			}
			case "inside": {
				if (node.type === "file") {
					throw new Error("Cannot drop an item inside a file");
				}

				dragged.siblings.splice(draggedIndex, 1);
				dragged.parent = node;
				node.tree.expanded.add(node.id);
				dropIndex = node.children.length;
				node.children.push(dragged);

				// The dragged item is removed temporarily from the DOM, so it loses focus.
				flushSync();
				treeState.getItemElement(dragged)?.focus();
				break;
			}
		}

		treeState.callbacks.onMoveItems(dragged.siblings, dropIndex, 1);
	}

	onDragEnd(): void {
		this.#treeState.draggedId = undefined;
	}

	onInputFocus(): void {
		this.#editing = true;
	}

	onInputEnterKeyDown({ name }: { name: string }): void {
		const treeState = this.#treeState;
		const node = this.getNode();

		if (name.length === 0) {
			treeState.callbacks.onRenameError(node, {
				type: "empty",
			});
			return;
		}

		if (name === node.name) {
			treeState.getItemElement(node)?.focus();
			return;
		}

		const duplicated = node.siblings.some((sibling) => sibling !== node && sibling.name === name);
		if (duplicated) {
			treeState.callbacks.onRenameError(node, {
				type: "duplicate",
				name,
			});
			return;
		}

		node.name = name;
		treeState.getItemElement(node)?.focus();
		treeState.callbacks.onRenameItem(node);
	}

	onInputEscapeKeyDown(): void {
		this.#treeState.getItemElement(this.getNode())?.focus();
	}

	onInputBlur(): void {
		this.#editing = false;
	}
}

function selectAll(nodes: FileTreeNode[], selected: Set<string>): void {
	for (const node of nodes) {
		selected.add(node.id);

		if (node.type === "folder" && node.expanded) {
			selectAll(node.children, selected);
		}
	}
}

function cloneNode(node: FileTreeNode): FileTreeNode {
	const { type, tree, name } = node;
	const id = crypto.randomUUID();
	switch (type) {
		case "file": {
			return tree.createFile({ id, name });
		}
		case "folder": {
			const clone = tree.createFolder({ id, name });
			clone.children = node.children.map(cloneNode);
			for (const child of clone.children) {
				child.parent = clone;
			}
			return clone;
		}
	}
}

function getDropPosition(node: FileTreeNode, rect: DOMRect, clientY: number): TreeItemDropPosition {
	switch (node.type) {
		case "file": {
			const midY = rect.top + rect.height / 2;
			return clientY < midY ? "before" : "after";
		}
		case "folder": {
			if (clientY < rect.top + rect.height / 3) {
				return "before";
			} else if (clientY > rect.bottom - rect.height / 3) {
				return "after";
			} else {
				return "inside";
			}
		}
	}
}
