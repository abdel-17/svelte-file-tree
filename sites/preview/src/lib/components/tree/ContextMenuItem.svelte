<script lang="ts">
	import { ContextMenu } from "bits-ui";

	let { ref = $bindable(null), class: className, ...rest }: ContextMenu.ItemProps = $props();
</script>

<ContextMenu.Item
	{...rest}
	bind:ref
	class={[
		"flex h-10 items-center gap-2 rounded p-3 text-sm font-medium select-none focus-visible:outline-2 focus-visible:outline-current data-highlighted:bg-gray-200",
		className,
	]}
/>
