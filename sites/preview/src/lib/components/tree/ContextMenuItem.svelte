<script lang="ts">
	import { ContextMenu } from "bits-ui";

	let { ref = $bindable(null), class: className, ...rest }: ContextMenu.ItemProps = $props();
</script>

<ContextMenu.Item
	{...rest}
	bind:ref
	class={[
		"flex items-center justify-between gap-2 rounded px-3 py-1.5 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200 [&>kbd]:font-sans [&>kbd]:font-normal [&>kbd]:text-gray-700",
		className,
	]}
/>
