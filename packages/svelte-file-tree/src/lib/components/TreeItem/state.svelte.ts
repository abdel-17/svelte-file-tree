import { createDerived, createRawState } from "svelte-signals";
import type { DropPosition, TreeItemState } from "../Tree/types.js";

export type DragStateProps = {
	draggedId: () => string | undefined;
	item: () => TreeItemState;
};

export function createDragState({ draggedId, item }: DragStateProps) {
	const [dropPosition, setDropPosition] = createRawState<DropPosition>();

	const canDrop = createDerived((): boolean => {
		if (draggedId() === undefined) {
			return false;
		}

		if (item().disabled()) {
			return false;
		}

		let current: TreeItemState | undefined = item();
		do {
			if (current.selected()) {
				// If the dragged item is dropped next to or inside a selected item,
				// it would cause a circular reference because the selected item
				// would be moved next to or inside itself.
				return false;
			}

			current = current.parent;
		} while (current !== undefined);

		return true;
	});

	function getLatestDropPosition(rect: DOMRect, clientY: number): DropPosition {
		switch (item().node.type) {
			case "file": {
				const midY = rect.top + rect.height / 2;
				return clientY < midY ? "before" : "after";
			}
			case "folder": {
				const { top, bottom, height } = rect;
				if (clientY < top + height / 3) {
					return "before";
				}
				if (clientY < bottom - height / 3) {
					return "inside";
				}
				return "after";
			}
		}
	}

	let updateRequestId: number | undefined;

	function updateDropPosition(element: HTMLElement, clientY: number): void {
		if (updateRequestId !== undefined) {
			return;
		}

		updateRequestId = window.requestAnimationFrame(() => {
			setDropPosition(getLatestDropPosition(element.getBoundingClientRect(), clientY));
			updateRequestId = undefined;
		});
	}

	function clearDropPosition(): void {
		setDropPosition(undefined);

		if (updateRequestId !== undefined) {
			window.cancelAnimationFrame(updateRequestId);
			updateRequestId = undefined;
		}
	}

	return {
		dropPosition,
		canDrop,
		getLatestDropPosition,
		updateDropPosition,
		clearDropPosition,
	};
}

export type DropPositionState = ReturnType<typeof createDragState>;
