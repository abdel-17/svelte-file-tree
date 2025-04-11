<script lang="ts">
	import { Dialog } from "bits-ui";
	import type { NameConflictResolution } from "svelte-file-tree";
	import { fade, fly } from "svelte/transition";

	const {
		open,
		title,
		description,
		onClose,
	}: {
		open: boolean;
		title: string;
		description: string;
		onClose: (result: NameConflictResolution) => void;
	} = $props();

	function handleOpenChange(open: boolean) {
		if (!open) {
			onClose("cancel");
		}
	}
</script>

<Dialog.Root bind:open={() => open, handleOpenChange}>
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
							{title}
						</Dialog.Title>

						<Dialog.Description class="mt-2 text-sm text-gray-700">
							{description}
						</Dialog.Description>

						<div class="mt-5 flex justify-end gap-3">
							<button
								class="flex h-10 items-center justify-center rounded-lg border border-current px-6 text-sm font-semibold hover:bg-current/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-current/12"
								onclick={() => onClose("skip")}
							>
								Skip
							</button>

							<button
								class="flex h-10 items-center justify-center rounded-lg border border-current px-6 text-sm font-semibold text-red-700 hover:bg-current/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:bg-current/12"
								onclick={() => onClose("cancel")}
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
