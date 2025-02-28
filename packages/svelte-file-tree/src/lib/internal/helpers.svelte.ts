import type { EventHandler } from "svelte/elements";

export function isControlOrMeta(event: KeyboardEvent | MouseEvent): boolean {
	// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
	// eslint-disable-next-line @typescript-eslint/no-deprecated
	if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
		return event.metaKey;
	}
	return event.ctrlKey;
}

export function composeEventHandlers<TEvent extends Event, TTarget extends EventTarget>(
	a: EventHandler<TEvent, TTarget> | null | undefined,
	b: EventHandler<TEvent, TTarget>,
): EventHandler<TEvent, TTarget> {
	return (event) => {
		if (a != null) {
			a(event);

			if (event.defaultPrevented) {
				return;
			}
		}

		b(event);
	};
}

export class State<T> {
	current: T = $state()!;

	constructor(initial: T) {
		this.current = initial;
	}
}

export class LinkedState<T> {
	readonly #fn: () => T;

	constructor(fn: () => T) {
		this.#fn = fn;
	}

	readonly #state: State<T> = $derived.by(() => new State(this.#fn()));

	get current(): T {
		return this.#state.current;
	}

	set current(value: T) {
		this.#state.current = value;
	}
}
