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
		| "ControlOrCommand"
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

	function isMac() {
		if (typeof navigator === "undefined") {
			return false;
		}
		return navigator.platform.startsWith("Mac") || navigator.platform === "iPhone";
	}

	function getShortcutText(key: KeyboardKey) {
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
			case "ControlOrCommand": {
				return isMac() ? "⌘" : "Ctrl";
			}
			case "Delete": {
				return "Del";
			}
			case "Escape": {
				return "Esc";
			}
			case "HomeOrEnd": {
				return "Home/End";
			}
			case "PageUpOrDown": {
				return "PgUp/PgDn";
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
			case "ControlOrCommand": {
				return isMac() ? "Command" : "Control";
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
		<kbd class="flex gap-2">
			{#each shortcut as key (key)}
				<kbd
					aria-label={getShortcutAriaLabel(key)}
					class="rounded border-r-2 border-b-2 border-slate-300 bg-slate-200 px-2 py-1 font-mono text-xs text-slate-700"
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
