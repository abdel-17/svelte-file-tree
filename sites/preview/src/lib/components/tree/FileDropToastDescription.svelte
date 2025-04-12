<script lang="ts">
	import { FolderIcon } from "@lucide/svelte";

	export let description: string;
</script>

<div class="mt-1 flex items-center gap-2">
	<FolderIcon role="presentation" size={20} class="fill-blue-300" />
	<span class="!text-base !font-normal">{description}</span>
</div>
