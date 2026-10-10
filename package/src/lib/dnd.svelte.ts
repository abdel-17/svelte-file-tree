import { on } from "svelte/events";
import type { SvelteSet } from "svelte/reactivity";
import type { FlatTreeItem } from "./flat-tree.js";
import { get_closest_treeitem, is_treeitem } from "./helpers.js";

export type TreeDndOptions<T> = {
	get_items: () => FlatTreeItem<T>[],
	get_selected_ids: () => SvelteSet<string>,
	has_children: (data: T) => boolean,
	on_drag?: (dragged_id: string, destination_index: number) => boolean,
	on_dragleave?: (dragged_id: string) => void,
	on_drop?: (dragged_id: string, destination_index: number) => void,
};

export class TreeDnd<T> {
	dragged_id: string | undefined = $state.raw();
	options: TreeDndOptions<T>;

	constructor(options: TreeDndOptions<T>) {
		this.options = options;
		this.attachment = this.attachment.bind(this);
		this._ondragstart = this._ondragstart.bind(this);
		this._ondragend = this._ondragend.bind(this);
		this._ondragover = this._ondragover.bind(this);
		this._ondragleave = this._ondragleave.bind(this);
		this._ondrop = this._ondrop.bind(this);
	}

	attachment(dropzone: HTMLElement): () => void {
		const cleanups = [
			on(dropzone, "dragstart", this._ondragstart),
			on(dropzone, "dragend", this._ondragend),
			on(dropzone, "dragenter", this._ondragover),
			on(dropzone, "dragover", this._ondragover),
			on(dropzone, "dragleave", this._ondragleave),
			on(dropzone, "drop", this._ondrop),
		];
		return () => {
			for (const cleanup of cleanups) {
				cleanup();
			}
		};
	}

	_get_destination_index(event: DragEvent, dragged_id: string): number | undefined {
		if (event.defaultPrevented) {
			return;
		}
		const treeitem = get_closest_treeitem(event.target);
		if (treeitem === null) {
			return -1;
		}
		if (treeitem.ariaDisabled === "true") {
			return;
		}
		const items = this.options.get_items();
		const index = Number(treeitem.dataset.index);
		const item = items[index];
		if (item === undefined || item.id === dragged_id) {
			return;
		}

		const destination_index = this.options.has_children(item.data) ? index : item.parent_index;
		const selected_ids = this.options.get_selected_ids();
		for (let i = destination_index; i !== -1;) {
			const folder = items[i]!;
			if (folder.id === dragged_id || selected_ids.has(folder.id)) {
				// Prevent moving a folder inside itself.
				return;
			}
			i = folder.parent_index;
		}
		return destination_index;
	}

	_ondragstart(event: DragEvent): void {
		if (event.defaultPrevented) {
			return;
		}
		const treeitem = event.target;
		if (!is_treeitem(treeitem)) {
			return;
		}
		const items = this.options.get_items();
		const index = Number(treeitem.dataset.index);
		const item = items[index];
		if (item === undefined) {
			return;
		}
		if (treeitem.ariaDisabled === "true") {
			event.preventDefault();
			return;
		}

		event.dataTransfer!.effectAllowed = "move";
		this.dragged_id = item.id;

		if (treeitem.ariaSelected === "false") {
			const selected_ids = this.options.get_selected_ids();
			selected_ids.clear();
			selected_ids.add(item.id);
		}
	}

	_ondragend(): void {
		this.dragged_id = undefined;
	}

	_ondragover(event: DragEvent): void {
		const dragged_id = this.dragged_id;
		if (dragged_id === undefined) {
			return;
		}
		const destination_index = this._get_destination_index(event, dragged_id);
		if (destination_index !== undefined) {
			const on_drag = this.options.on_drag;
			if (on_drag == null || on_drag(dragged_id, destination_index)) {
				event.dataTransfer!.dropEffect = "move";
				event.preventDefault();
			}
		}
	}

	_ondragleave(event: DragEvent): void {
		const dragged_id = this.dragged_id;
		if (dragged_id === undefined) {
			return;
		}
		const treeitem = get_closest_treeitem(event.target);
		if (treeitem === null || !treeitem.contains(event.relatedTarget as Node)) {
			// We don't want to call `on_dragleave` if the user hovers over
			// a different child element inside the same treeitem.
			this.options.on_dragleave?.(dragged_id);
		}
	}

	_ondrop(event: DragEvent): void {
		const dragged_id = this.dragged_id;
		if (dragged_id === undefined) {
			return;
		}
		const destination_index = this._get_destination_index(event, dragged_id);
		if (destination_index !== undefined) {
			event.preventDefault();
			this.options.on_drop?.(dragged_id, destination_index);
		}
		this.dragged_id = undefined;
	}
}
