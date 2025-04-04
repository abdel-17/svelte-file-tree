<script lang="ts">
	import { Dialog } from "bits-ui";
	import type { NameConflictResolution } from "svelte-file-tree";
	import { fade, fly } from "svelte/transition";

	type OpenArgs = {
		title: string;
		description: string;
		onClose: (resolution: NameConflictResolution) => void;
	};

	let openArgs: OpenArgs | undefined = $state.raw();

	export function open(args: OpenArgs): void {
		if (openArgs !== undefined) {
			throw new Error("Dialog is already open");
		}

		openArgs = args;
	}

	export function close(resolution: NameConflictResolution): void {
		openArgs?.onClose(resolution);
		openArgs = undefined;
	}

	function handleOpenChange(open: boolean): void {
		if (!open) {
			close("cancel");
		}
	}
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
			class="fixed top-0 left-1/2 z-50 w-xs -translate-x-1/2 rounded-b-lg bg-neutral-100 p-4 md:w-md"
		>
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fly={{ y: "-100%" }}>
						<Dialog.Title class="text-center text-lg font-semibold tracking-tight">
							{openArgs?.title}
						</Dialog.Title>

						<Dialog.Description class="mt-2 text-sm text-gray-700">
							{openArgs?.description}
						</Dialog.Description>

						<div class="mt-5 flex justify-end gap-3">
							<button
								class="flex h-10 items-center justify-center rounded-lg border border-current px-6 text-sm font-semibold hover:bg-current/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-current/12"
								onclick={() => close("skip")}
							>
								Skip
							</button>

							<button
								class="flex h-10 items-center justify-center rounded-lg border border-current px-6 text-sm font-semibold text-red-700 hover:bg-current/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-current/12"
								onclick={() => close("cancel")}
							>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
