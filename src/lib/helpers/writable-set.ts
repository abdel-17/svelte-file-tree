import { writable, type Writable } from "svelte/store";

export interface WritableSet<T> extends Writable<Set<T>> {
	add: (value: T) => void;
	delete: (value: T) => void;
	toggle: (value: T) => void;
	clear: () => void;
}

export function writableSet<T>(
	initialValue: Set<T> = new Set(),
): WritableSet<T> {
	const { subscribe, set, update } = writable(initialValue);
	return {
		subscribe,
		set,
		update,
		add(value) {
			this.update((set) => {
				set.add(value);
				return set;
			});
		},
		delete(value) {
			this.update((set) => {
				set.delete(value);
				return set;
			});
		},
		toggle(value) {
			this.update((set) => {
				if (set.has(value)) {
					set.delete(value);
				} else {
					set.add(value);
				}
				return set;
			});
		},
		clear() {
			this.update((set) => {
				set.clear();
				return set;
			});
		},
	};
}
