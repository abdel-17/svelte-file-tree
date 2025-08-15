<script lang="ts">
	import { CheckIcon, CircleAlertIcon, CopyIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	const { code }: { code: string } = $props();

	let copyCodeStatus: "idle" | "success" | "error" = $state.raw("idle");
	let copyCodeTimeoutId: number | undefined;

	const CopyCodeIcon = $derived.by(() => {
		switch (copyCodeStatus) {
			case "idle": {
				return CopyIcon;
			}
			case "success": {
				return CheckIcon;
			}
			case "error": {
				return CircleAlertIcon;
			}
		}
	});

	async function copyCode() {
		window.clearTimeout(copyCodeTimeoutId);

		try {
			await navigator.clipboard.writeText(code);
			copyCodeStatus = "success";
		} catch (error) {
			copyCodeStatus = "error";
			toast.error("Failed to copy to clipboard");
			console.error(error);
		}

		copyCodeTimeoutId = window.setTimeout(() => {
			copyCodeStatus = "idle";
		}, 2000);
	}

	$effect(() => {
		return () => {
			window.clearTimeout(copyCodeTimeoutId);
		};
	});
</script>

<div class="relative mt-4 rounded-lg bg-neutral-800 text-white">
	<pre class="overflow-x-auto p-4 pe-15 font-mono">{code}</pre>

	<button
		class="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-current/8 active:bg-current/12"
		onclick={copyCode}
	>
		<CopyCodeIcon role="presentation" class="size-5" />
		<span class="sr-only">Copy</span>
	</button>
</div>
