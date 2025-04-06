<script lang="ts">
	import { Dialog } from "bits-ui";
	import type { EventHandler } from "svelte/elements";
	import { fade, scale } from "svelte/transition";

	const nameId = $props.id();

	type OpenArgs = {
		onSubmit: (name: string) => void;
	};

	let openArgs: OpenArgs | undefined = $state.raw();
	let name = $state.raw("");

	export function open(args: OpenArgs): void {
		if (openArgs !== undefined) {
			throw new Error("Dialog is already open");
		}

		openArgs = args;
	}

	export function close(): void {
		openArgs = undefined;
		name = "";
	}

	function handleOpenChange(open: boolean): void {
		if (!open) {
			close();
		}
	}

	const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = (event) => {
		if (openArgs === undefined) {
			throw new Error("Dialog is closed");
		}

		event.preventDefault();
		openArgs.onSubmit(name);
	};
</script>

<Dialog.Root bind:open={() => openArgs !== undefined, handleOpenChange}>
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
							New Folder
						</Dialog.Title>

						<form class="mt-4" onsubmit={handleSubmit}>
							<label for={nameId} class="text-sm font-medium">Name</label>
							<input
								bind:value={name}
								id={nameId}
								required
								class="mt-1 block h-9 w-full rounded border border-slate-400 bg-white px-3 focus-visible:border-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
							/>

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
