import type { Writable } from "svelte/store";

export function withChangeListener<TValue, TStore extends Writable<TValue>>(
	store: TStore,
	onChange: (value: TValue) => void,
) {
	return {
		...store,
		set(value) {
			onChange(value);
			store.set(value);
		},
		update(updater) {
			store.update((current) => {
				const value = updater(current);
				onChange(value);
				return value;
			});
		},
	} satisfies Writable<TValue>;
}
