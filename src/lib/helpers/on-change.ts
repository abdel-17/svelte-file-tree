import type { StoresValues, Writable } from "svelte/store";

export function onChange<TStore extends Writable<any>>(
	store: TStore,
	onChange: (value: StoresValues<TStore>) => void,
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
	} satisfies Writable<StoresValues<TStore>>;
}
