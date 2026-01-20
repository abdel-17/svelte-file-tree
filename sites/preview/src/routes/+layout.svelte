<script lang="ts">
	import "../app.css";
	import { Toaster } from "svelte-sonner";

	const { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
	/>
</svelte:head>

<Toaster richColors />

<main class="mx-auto max-w-5xl px-6">
	{@render children()}
</main>
