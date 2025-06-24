<script lang="ts">
	import { AlertDialog } from "bits-ui";
	import { fade, scale } from "svelte/transition";

	let open = $state.raw(false);
	let title = $state.raw("");
	let description = $state.raw("");
	let resolveShow: ((value: boolean) => void) | undefined;

	export function show(args: { title: string; description: string }) {
		return new Promise<boolean>((resolve) => {
			open = true;
			title = args.title;
			description = args.description;
			resolveShow = resolve;
		});
	}

	export function close(value: boolean) {
		open = false;
		resolveShow?.(value);
		resolveShow = undefined;
	}

	function onOpenChange(open: boolean) {
		if (!open) {
			close(false);
		}
	}
</script>

<AlertDialog.Root {onOpenChange} bind:open>
	<AlertDialog.Portal>
		<AlertDialog.Overlay forceMount class="fixed inset-0 z-50 bg-black/80">
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:fade={{ duration: 200 }}></div>
				{/if}
			{/snippet}
		</AlertDialog.Overlay>

		<AlertDialog.Content
			forceMount
			class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-7 text-black shadow"
		>
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} transition:scale={{ duration: 200 }}>
						<AlertDialog.Title class="text-lg font-semibold tracking-tight">
							{title}
						</AlertDialog.Title>

						<AlertDialog.Description class="mt-2 text-sm text-gray-700">
							{description}
						</AlertDialog.Description>

						<div class="mt-4 flex justify-end gap-2">
							<AlertDialog.Cancel
								class="inline-flex h-10 items-center justify-center rounded bg-neutral-200 px-6 text-sm font-medium hover:bg-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current active:scale-95"
							>
								Cancel
							</AlertDialog.Cancel>

							<AlertDialog.Action
								class="inline-flex h-10 items-center justify-center rounded bg-red-700 px-6 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 active:scale-95"
								onclick={() => close(true)}
							>
								Confirm
							</AlertDialog.Action>
						</div>
					</div>
				{/if}
			{/snippet}
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
