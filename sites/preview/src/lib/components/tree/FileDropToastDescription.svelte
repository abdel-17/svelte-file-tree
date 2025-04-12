<script lang="ts">
	import { FolderIcon } from "@lucide/svelte";

	export let description: string;
</script>

<div class="flex items-center gap-2">
	<FolderIcon size={16} strokeWidth={3} class="fill-blue-300" />
	<span class="!text-base !font-semibold">{description}</span>
</div>
