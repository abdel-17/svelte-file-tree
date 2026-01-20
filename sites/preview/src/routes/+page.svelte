<script lang="ts">
	import GithubLink from "$lib/GithubLink.svelte";

	const shortcuts = [
		{
			keys: ["ArrowUpOrDown"],
			description: "Move up/down and select only the focused item",
		},
		{
			keys: ["Shift", "ArrowUpOrDown"],
			description: "Move up/down and select the current and focused item",
		},
		{
			keys: ["ControlOrCommand", "ArrowUpOrDown"],
			description: "Move up/down without affecting selection",
		},
		{
			keys: ["ArrowRight"],
			description: "Expand folder or move to the first child",
		},
		{
			keys: ["ArrowLeft"],
			description: "Collapse folder or move to the parent",
		},
		{
			keys: ["PageUpOrDown"],
			description: "Move one page up/down and select only the focused item",
		},
		{
			keys: ["ControlOrCommand", "Shift", "PageUpOrDown"],
			description: "Move one page up/down and select all visible items between",
		},
		{
			keys: ["HomeOrEnd"],
			description: "Move to the first/last visible item and select only the focused item",
		},
		{
			keys: ["ControlOrCommand", "Shift", "HomeOrEnd"],
			description: "Move to the first/last visible item and select all visible items between",
		},
		{
			keys: ["Asterisk"],
			description: "Expand all siblings",
		},
		{
			keys: ["Space"],
			description: "Toggle selection",
		},
		{
			keys: ["Shift", "Space"],
			description: "Select multiple items",
		},
		{
			keys: ["ControlOrCommand", "a"],
			description: "Select all visible items",
		},
		{
			keys: ["ControlOrCommand", "c"],
			description: "Copy to clipboard",
		},
		{
			keys: ["ControlOrCommand", "x"],
			description: "Cut to clipboard",
		},
		{
			keys: ["ControlOrCommand", "v"],
			description: "Paste",
		},
		{
			keys: ["Escape"],
			description: "Clear selection and clipboard",
		},
		{
			keys: ["Delete"],
			description: "Delete",
		},
	];

	function is_mac() {
		if (typeof navigator === "undefined") {
			return false;
		}
		return navigator.platform.startsWith("Mac") || navigator.platform === "iPhone";
	}

	function get_shortcut_text(key: string) {
		switch (key) {
			case "ArrowLeft":
				return "←";
			case "ArrowRight":
				return "→";
			case "ArrowUpOrDown":
				return "↑/↓";
			case "Asterisk":
				return "*";
			case "ControlOrCommand":
				return is_mac() ? "⌘" : "Ctrl";
			case "Delete":
				return "Del";
			case "Escape":
				return "Esc";
			case "HomeOrEnd":
				return "Home/End";
			case "PageUpOrDown":
				return "PgUp/PgDn";
			default:
				return key;
		}
	}

	function get_shortcut_aria_label(key: string) {
		switch (key) {
			case "ArrowLeft":
				return "Arrow left";
			case "ArrowRight":
				return "Arrow right";
			case "ArrowUpOrDown":
				return "Arrow up or down";
			case "ControlOrCommand":
				return is_mac() ? "Command" : "Control";
			case "HomeOrEnd":
				return "Home or end";
			case "PageUpOrDown":
				return "Page up or down";
			default:
				return key;
		}
	}

	const examples = [
		{
			title: "Basic Usage",
			description: "Simple tree representing a filesystem",
			href: "/basic",
		},
		{
			title: "Virtualization",
			description: "Large tree rendered efficiently with virtualization",
			href: "/virtualization",
		},
	];
</script>

<div class="space-y-10 py-16">
	<section>
		<h1 class="text-center text-5xl font-bold text-slate-800">Svelte File Tree</h1>
		<p class="mt-3 text-center text-2xl text-slate-700">
			Unstyled file tree component library for Svelte
		</p>
	</section>

	<section>
		<h2 class="text-3xl font-semibold text-slate-800">Keyboard Shortcuts</h2>
		<div class="mt-4 overflow-x-auto rounded-xl border border-slate-300">
			<table class="w-full bg-slate-50">
				<thead class="border-b border-slate-300 bg-slate-100">
					<tr>
						<th class="px-6 py-4 text-left text-sm font-semibold text-slate-800">Shortcut</th>
						<th class="px-6 py-4 text-left text-sm font-semibold text-slate-800">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200">
					{#each shortcuts as shortcut}
						<tr>
							<td class="px-6 py-3">
								<kbd class="flex gap-2">
									{#each shortcut.keys as key}
										<kbd
											aria-label={get_shortcut_aria_label(key)}
											class="rounded border-r-2 border-b-2 border-slate-300 bg-slate-200 px-2 py-1 font-mono text-xs text-slate-700"
										>
											{get_shortcut_text(key)}
										</kbd>
									{/each}
								</kbd>
							</td>
							<td class="px-6 py-3 text-sm text-slate-700">
								{shortcut.description}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="@container">
		<h2 class="text-3xl font-semibold text-slate-800">Examples</h2>
		<div class="mt-4 grid gap-6 @min-4xl:grid-cols-2">
			{#each examples as example}
				<section
					class="@container flex flex-col rounded-xl border border-slate-300 bg-slate-50 p-6"
				>
					<h3 class="text-xl font-semibold text-slate-800">{example.title}</h3>
					<p class="mt-3 text-slate-700">{example.description}</p>
					<div class="mt-6 grid gap-4 @min-sm:grid-cols-2">
						<a
							href={example.href}
							class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 active:scale-95"
						>
							View Example
						</a>

						<GithubLink
							href="https://github.com/abdel-17/svelte-file-tree/tree/master/sites/preview/src/routes{example.href}/+page.svelte"
							label="View Code"
						/>
					</div>
				</section>
			{/each}
		</div>
	</section>

	<section class="text-center">
		<GithubLink href="https://github.com/abdel-17/svelte-file-tree" label="View on GitHub" />
	</section>
</div>
