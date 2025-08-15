<script lang="ts">
	import { GithubIcon } from "@lucide/svelte";
	import type { Snippet } from "svelte";

	const {
		href,
		children,
	}: {
		href: string;
		children: Snippet;
	} = $props();
</script>

<a
	{href}
	target="_blank"
	rel="noopener noreferrer"
	class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25292e] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0d1117] active:scale-95"
>
	<GithubIcon role="presentation" class="size-5" />
	{@render children()}
</a>
