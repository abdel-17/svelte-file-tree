import { writable, type Writable } from "svelte/store";

export interface WritableSet<T> extends Writable<Set<T>> {
	add: (element: T) => void;
	delete: (element: T) => void;
	toggle: (element: T) => void;
	clear: () => void;
}

export function writableSet<T>(
	initialValue: Set<T> = new Set(),
): WritableSet<T> {
	const store = writable(initialValue);
	return {
		...store,
		add(element) {
			this.update((value) => {
				value.add(element);
				return value;
			});
		},
		delete(element) {
			this.update((value) => {
				value.delete(element);
				return value;
			});
		},
		toggle(element) {
			this.update((value) => {
				if (value.has(element)) {
					value.delete(element);
				} else {
					value.add(element);
				}
				return value;
			});
		},
		clear() {
			this.update((value) => {
				value.clear();
				return value;
			});
		},
	};
}
