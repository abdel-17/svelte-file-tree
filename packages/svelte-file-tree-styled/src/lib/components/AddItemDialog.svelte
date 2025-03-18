<script lang="ts">
	import { Dialog } from "bits-ui";
	import type { EventHandler } from "svelte/elements";
	import { fade, scale } from "svelte/transition";

	const id = $props.id();
	const typeId = `${id}:type`;
	const nameId = `${id}:name`;

	type SubmitResult = {
		type: "file" | "folder";
		name: string;
	};

	let isOpen = $state.raw(false);
	let type: "file" | "folder" = $state.raw("file");
	let name = $state.raw("");
	let onSubmit: ((result: SubmitResult) => Promise<boolean>) | undefined;
	let onCancel: (() => void) | undefined;

	type OpenArgs = {
		onSubmit?: (result: SubmitResult) => Promise<boolean>;
		onCancel?: () => void;
	};

	export function open(args: OpenArgs = {}) {
		if (isOpen) {
			throw new Error("The dialog is already open");
		}

		isOpen = true;
		onSubmit = args.onSubmit;
		onCancel = args.onCancel;
	}

	function reset(): void {
		onCancel = undefined;
		onSubmit = undefined;
		name = "";
		type = "file";
		isOpen = false;
	}

	const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
		event.preventDefault();

		if (onSubmit !== undefined) {
			const didSubmit = await onSubmit({ type, name });
			if (!didSubmit) {
				return;
			}
		}

		reset();
	};

	function onOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			onCancel?.();
			reset();
		}
	}
</script>

<Dialog.Root bind:open={isOpen} {onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay forceMount class="fixed inset-0 z-50 bg-black/50">
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fade={{ duration: 200 }}></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>

		<Dialog.Content
			forceMount
			class="fixed top-1/2 left-1/2 z-50 w-xs -translate-x-1/2 -translate-y-1/2 rounded-lg bg-neutral-100 p-4 md:w-md"
		>
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:scale={{ duration: 200, start: 0.9 }}>
						<Dialog.Title class="text-center text-2xl font-semibold tracking-tight">
							Add a New Item
						</Dialog.Title>

						<form class="mt-4" onsubmit={handleSubmit}>
							<div>
								<label for={typeId} class="text-sm font-medium">Type</label>
								<select
									id={typeId}
									bind:value={type}
									class="mt-1 block h-9 rounded border border-slate-400 bg-white ps-1 focus-visible:border-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
								>
									<option>file</option>
									<option>folder</option>
								</select>
							</div>

							<div class="mt-3">
								<label for={nameId} class="text-sm font-medium">Name</label>
								<input
									id={nameId}
									bind:value={name}
									required
									class="mt-1 block h-9 w-full rounded border border-slate-400 bg-white px-3 focus-visible:border-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
								/>
							</div>

							<div class="mt-5 ml-auto w-fit">
								<button
									type="submit"
									class="flex h-10 items-center justify-center rounded-lg border border-current px-6 text-sm font-semibold hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-neutral-300"
								>
									Add
								</button>
							</div>
						</form>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
