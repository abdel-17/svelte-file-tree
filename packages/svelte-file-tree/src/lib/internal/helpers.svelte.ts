export const isControlOrMeta = (event: KeyboardEvent | MouseEvent): boolean => {
	// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform#examples
	// eslint-disable-next-line @typescript-eslint/no-deprecated
	if (navigator.platform.startsWith("Mac") || navigator.platform === "iPhone") {
		return event.metaKey;
	}
	return event.ctrlKey;
};

export const createState = <T>(initial: T) => {
	let current = $state(initial);
	return [
		(): T => current,
		(value: T): void => {
			current = value;
		},
	] as const;
};

export const createLinkedState = <T>(fn: () => T) => {
	const state = $derived(createState(fn()));
	return [
		(): T => state[0](),
		(value: T): void => {
			state[1](value);
		},
	] as const;
};
