<script lang="ts">
	import { GithubIcon } from "@lucide/svelte";

	const { href, label }: { href: string; label: string } = $props();
</script>

<a
	{href}
	target="_blank"
	rel="noopener noreferrer"
	class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25292e] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0d1117] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25292e] active:scale-95"
>
	<GithubIcon role="presentation" class="size-5" />
	{label}
</a>
