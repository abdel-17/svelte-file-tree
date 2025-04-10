import type { NameConflictResolution } from "svelte-file-tree";

export class NameConflictDialogState {
	#open = $state.raw(false);
	#title = $state.raw("");
	#description = $state.raw("");
	#onClose?: (result: NameConflictResolution) => void;

	get open(): boolean {
		return this.#open;
	}

	get title(): string {
		return this.#title;
	}

	get description(): string {
		return this.#description;
	}

	show({
		title,
		description,
		onClose,
	}: {
		title: string;
		description: string;
		onClose: (result: NameConflictResolution) => void;
	}): void {
		this.#open = true;
		this.#title = title;
		this.#description = description;
		this.#onClose = onClose;
	}

	close(result: NameConflictResolution): void {
		this.#open = false;
		this.#title = "";
		this.#description = "";
		this.#onClose!(result);
		this.#onClose = undefined;
	}
}

export class NameFormDialogState {
	name = $state.raw("");
	#open = $state.raw(false);
	#title = $state.raw("");
	#onSubmit?: (name: string) => void;

	get open(): boolean {
		return this.#open;
	}

	get title(): string {
		return this.#title;
	}

	show({ title, onSubmit }: { title: string; onSubmit: (name: string) => void }): void {
		this.#open = true;
		this.#title = title;
		this.#onSubmit = onSubmit;
	}

	submit(): void {
		this.#onSubmit!(this.name);
	}

	close(): void {
		this.name = "";
		this.#open = false;
		this.#title = "";
		this.#onSubmit = undefined;
	}
}
