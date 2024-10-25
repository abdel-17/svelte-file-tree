import type { MaybeGetter } from "$lib/types.js";

export function unwrap<T>(value: MaybeGetter<T>): T;

export function unwrap(value: unknown) {
	if (typeof value === "function") {
		return value();
	}
	return value;
}
