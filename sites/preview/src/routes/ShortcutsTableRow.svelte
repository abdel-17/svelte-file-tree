<script lang="ts">
	type KeyboardKey =
		| "a"
		| "c"
		| "v"
		| "x"
		| "ArrowLeft"
		| "ArrowRight"
		| "ArrowUpOrDown"
		| "Asterisk"
		| "Control"
		| "Delete"
		| "Escape"
		| "HomeOrEnd"
		| "PageUpOrDown"
		| "Shift"
		| "Space";

	const {
		shortcut,
		description,
	}: {
		shortcut: Array<KeyboardKey>;
		description: string;
	} = $props();

	function getShortcutText(key: KeyboardKey) {
		let isMac = false;
		if (typeof navigator !== "undefined") {
			isMac = navigator.platform.startsWith("Mac") || navigator.platform === "iPhone";
		}

		switch (key) {
			case "ArrowLeft": {
				return "←";
			}
			case "ArrowRight": {
				return "→";
			}
			case "ArrowUpOrDown": {
				return "↑/↓";
			}
			case "Asterisk": {
				return "*";
			}
			case "Control": {
				return isMac ? "⌘" : "Ctrl";
			}
			case "Delete": {
				return "Del";
			}
			case "Escape": {
				return "Esc";
			}
			case "PageUpOrDown": {
				return "PgUp/PgDn";
			}
			case "HomeOrEnd": {
				return "Home/End";
			}
			default: {
				return key;
			}
		}
	}

	function getShortcutAriaLabel(key: KeyboardKey) {
		switch (key) {
			case "ArrowLeft": {
				return "Arrow left";
			}
			case "ArrowRight": {
				return "Arrow right";
			}
			case "ArrowUpOrDown": {
				return "Arrow up or down";
			}
			case "HomeOrEnd": {
				return "Home or end";
			}
			case "PageUpOrDown": {
				return "Page up or down";
			}
			default: {
				return key;
			}
		}
	}
</script>

<tr>
	<td class="px-6 py-3">
		<kbd class="flex gap-1">
			{#each shortcut as key (key)}
				<kbd
					aria-label={getShortcutAriaLabel(key)}
					class="rounded bg-slate-200 px-2 py-1 font-mono text-xs text-slate-700"
				>
					{getShortcutText(key)}
				</kbd>
			{/each}
		</kbd>
	</td>

	<td class="px-6 py-3 text-sm text-slate-700">
		{description}
	</td>
</tr>
