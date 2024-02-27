import type { Writable } from "svelte/store";

export function withChangeListener<T>(
	store: Writable<T>,
	onChange: (value: T) => void,
): Writable<T> {
	return {
		subscribe: store.subscribe,
		set(value: T) {
			onChange(value);
			store.set(value);
		},
		update(updater: (value: T) => T) {
			store.update((current) => {
				const value = updater(current);
				onChange(value);
				return value;
			});
		},
	};
}
