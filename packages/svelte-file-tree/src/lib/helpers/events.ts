export type EventHandler<E extends Event> = (event: E) => void;

export function composeEventHandlers<E extends Event>(
	handler: EventHandler<E>,
	secondaryHandler: EventHandler<E> | null | undefined,
): (event: E) => void {
	return (event) => {
		handler(event);
		secondaryHandler?.(event);
	};
}
