<script lang="ts">
import { isControlOrMeta } from "$lib/shared.js";
import type { EventHandler } from "svelte/elements";
import { TreeItemContext } from "../Tree/context.svelte.js";
import type { TreeItemProps } from "./types.js";

const context = TreeItemContext.get();

let {
	children,
	editable = false,
	element = $bindable(null),
	onfocusin,
	onkeydown,
	onclick,
	ondragstart,
	ondragenter,
	ondragover,
	ondragleave,
	ondrop,
	ondragend,
	...attributes
}: TreeItemProps = $props();

const handleFocusIn: EventHandler<FocusEvent, HTMLDivElement> = (event) => {
	onfocusin?.(event);

	context.onFocusIn();
};

const handleKeyDown: EventHandler<KeyboardEvent, HTMLDivElement> = (event) => {
	onkeydown?.(event);

	if (event.target !== event.currentTarget) {
		// Don't handle keydown events that bubble up from elements inside
		// like inputs and buttons to avoid conflicting with their behavior.
		return;
	}

	switch (event.key) {
		case "ArrowRight": {
			context.onArrowRightKeyDown();
			break;
		}
		case "ArrowLeft": {
			context.onArrowLeftKeyDown();
			break;
		}
		case "ArrowDown":
		case "ArrowUp": {
			context.onArrowUpOrDownKeyDown({
				down: event.key === "ArrowDown",
				shift: event.shiftKey,
			});
			break;
		}
		case "PageDown":
		case "PageUp": {
			context.onPageUpOrDownKeyDown({
				element: event.currentTarget,
				down: event.key === "PageDown",
				shift: event.shiftKey,
			});
			break;
		}
		case "Home": {
			context.onHomeKeyDown({
				shift: event.shiftKey,
				ctrlOrMeta: isControlOrMeta(event),
			});
			break;
		}
		case "End": {
			context.onEndKeyDown({
				shift: event.shiftKey,
				ctrlOrMeta: isControlOrMeta(event),
			});
			break;
		}
		case " ": {
			context.onSpaceKeyDown({
				element: event.currentTarget,
				shift: event.shiftKey,
			});
			break;
		}
		case "Escape": {
			context.onEscapeKeyDown();
			break;
		}
		case "*": {
			context.onAsteriskKeyDown({
				element: event.currentTarget,
			});
			break;
		}
		case "F2": {
			context.onF2KeyDown({ editable });
			break;
		}
		case "Delete": {
			context.onDeleteKeyDown();
			break;
		}
		case "a": {
			context.onAKeyDown({
				ctrlOrMeta: isControlOrMeta(event),
			});
			break;
		}
		case "c": {
			context.onCKeyDown({
				ctrlOrMeta: isControlOrMeta(event),
			});
			break;
		}
		case "v": {
			context.onVKeyDown({
				ctrlOrMeta: isControlOrMeta(event),
			});
			break;
		}
		default: {
			return;
		}
	}

	event.preventDefault();
};

const handleClick: EventHandler<MouseEvent, HTMLDivElement> = (event) => {
	onclick?.(event);

	context.onClick({
		element: event.currentTarget,
		shift: event.shiftKey,
		ctrlOrMeta: isControlOrMeta(event),
	});
};

const handleDragStart: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragstart?.(event);

	context.onDragStart();

	if (event.dataTransfer !== null) {
		event.dataTransfer.effectAllowed = "move";
	}
};

const handleDragEnter: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragenter?.(event);

	const shouldHandle = context.onDragEnter({
		element: event.currentTarget,
		clientY: event.clientY,
	});

	if (!shouldHandle) {
		return;
	}

	if (event.dataTransfer !== null) {
		event.dataTransfer.dropEffect = "move";
	}

	event.preventDefault();
};

const handleDragOver: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragover?.(event);

	const shouldHandle = context.onDragOver({
		element: event.currentTarget,
		clientY: event.clientY,
	});

	if (!shouldHandle) {
		return;
	}

	if (event.dataTransfer !== null) {
		event.dataTransfer.dropEffect = "move";
	}

	event.preventDefault();
};

const handleDragLeave: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragleave?.(event);

	context.onDragLeave({
		element: event.currentTarget,
		to: event.relatedTarget,
	});
};

const handleDrop: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondrop?.(event);

	context.onDrop({
		element: event.currentTarget,
		clientY: event.clientY,
	});
};

const handleDragEnd: EventHandler<DragEvent, HTMLDivElement> = (event) => {
	ondragend?.(event);

	context.onDragEnd();
};
</script>

<div
	{...attributes}
	bind:this={element}
	id={context.getElementId()}
	role="treeitem"
	aria-selected={context.getAriaSelected()}
	aria-expanded={context.getAriaExpanded()}
	aria-level={context.getAriaLevel()}
	aria-posinset={context.getAriaPosInSet()}
	aria-setsize={context.getAriaSetSize()}
	tabindex={context.getTabIndex()}
	onfocusin={handleFocusIn}
	onkeydown={handleKeyDown}
	onclick={handleClick}
	ondragstart={handleDragStart}
	ondragenter={handleDragEnter}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	{@render children()}
</div>
