<script lang="ts">
	import {
		AlignVerticalSpaceAroundIcon,
		HandIcon,
		KeyboardIcon,
		ScrollIcon,
		UploadIcon,
		ZapIcon,
	} from "@lucide/svelte";
	import CodeBlock from "./CodeBlock.svelte";
	import GithubLink from "./GithubLink.svelte";
	import ShortcutsTableRow from "./ShortcutsTableRow.svelte";
</script>

<main class="mx-auto max-w-5xl space-y-10 px-6 py-16">
	<section>
		<h1 class="text-center text-5xl font-bold text-slate-800">Svelte File Tree</h1>

		<p class="mt-3 text-center text-2xl text-slate-700">
			Unstyled file tree component library for Svelte
		</p>
	</section>

	<section>
		<h2 class="text-3xl font-semibold text-slate-800">Installation</h2>
		<CodeBlock code="npm install svelte-file-tree" />
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
					<ShortcutsTableRow
						shortcut={["ArrowUpOrDown"]}
						description="Move up/down and select only the next item"
					/>

					<ShortcutsTableRow
						shortcut={["Control", "ArrowUpOrDown"]}
						description="Move up/down without affecting selection"
					/>

					<ShortcutsTableRow
						shortcut={["Shift", "ArrowUpOrDown"]}
						description="Move up/down and select the current and next item"
					/>

					<ShortcutsTableRow
						shortcut={["ArrowRight"]}
						description="Expand folder or move to the first child"
					/>

					<ShortcutsTableRow
						shortcut={["ArrowLeft"]}
						description="Collapse folder or move to the parent"
					/>

					<ShortcutsTableRow shortcut={["PageUpOrDown"]} description="Move one page up/down" />

					<ShortcutsTableRow
						shortcut={["Control", "Shift", "PageUpOrDown"]}
						description="Move one page up/down and select all visible items between"
					/>

					<ShortcutsTableRow
						shortcut={["HomeOrEnd"]}
						description="Move to the first/last visible item"
					/>

					<ShortcutsTableRow
						shortcut={["Control", "Shift", "HomeOrEnd"]}
						description="Move to the first/last visible item and select all visible items between"
					/>

					<ShortcutsTableRow shortcut={["Asterisk"]} description="Expand all siblings" />

					<ShortcutsTableRow shortcut={["Space"]} description="Toggle selection" />

					<ShortcutsTableRow shortcut={["Shift", "Space"]} description="Select multiple items" />

					<ShortcutsTableRow shortcut={["Control", "a"]} description="Select all visible items" />

					<ShortcutsTableRow shortcut={["Control", "c"]} description="Copy to clipboard" />

					<ShortcutsTableRow shortcut={["Control", "x"]} description="Cut to clipboard" />

					<ShortcutsTableRow shortcut={["Control", "v"]} description="Paste" />

					<ShortcutsTableRow
						shortcut={["Control", "Shift", "v"]}
						description="Paste into the parent folder"
					/>

					<ShortcutsTableRow shortcut={["Escape"]} description="Clear selection and clipboard" />

					<ShortcutsTableRow shortcut={["Delete"]} description="Delete" />
				</tbody>
			</table>
		</div>
	</section>

	<section class="@container">
		<h2 class="text-3xl font-semibold text-slate-800">Examples</h2>

		<div class="mt-4 grid gap-6 @min-4xl:grid-cols-2">
			<section class="@container flex flex-col rounded-xl border border-slate-300 bg-slate-50 p-6">
				<h3 class="text-xl font-semibold text-slate-800">Basic Usage</h3>

				<p class="mt-3 text-slate-700">Simple tree representing a filesystem</p>

				<div class="grow"></div>

				<ul class="mt-6 space-y-3">
					<li class="flex items-center gap-2 text-sm text-slate-600">
						<KeyboardIcon role="presentation" class="size-4" />
						Keyboard Navigation
					</li>

					<li class="flex items-center gap-2 text-sm text-slate-600">
						<HandIcon role="presentation" class="size-4" />
						Drag and Drop
					</li>

					<li class="flex items-center gap-2 text-sm text-slate-600">
						<UploadIcon role="presentation" class="size-4" />
						Upload Files
					</li>
				</ul>

				<div class="mt-6 grid gap-4 @min-sm:grid-cols-2">
					<a
						href="/basic"
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-800 active:scale-95"
					>
						View Example
					</a>

					<GithubLink
						href="https://github.com/abdel-17/svelte-file-tree/sites/preview/src/routes/basic/+page.svelte"
					>
						View Code
					</GithubLink>
				</div>
			</section>

			<section class="@container flex flex-col rounded-xl border border-slate-300 bg-slate-50 p-6">
				<h3 class="text-xl font-semibold text-slate-800">Virtualization</h3>

				<p class="mt-3 text-slate-700">Large tree rendered efficiently with virtualization</p>

				<div class="grow"></div>

				<ul class="mt-6 space-y-3">
					<li class="flex items-center gap-2 text-sm text-slate-600">
						<ScrollIcon role="presentation" class="size-4" />
						5000+ items
					</li>

					<li class="flex items-center gap-2 text-sm text-slate-600">
						<AlignVerticalSpaceAroundIcon role="presentation" class="size-4" />
						Virtualized
					</li>

					<li class="flex items-center gap-2 text-sm text-slate-600">
						<ZapIcon role="presentation" class="size-4" />
						Fast and Smooth
					</li>
				</ul>

				<div class="mt-6 grid gap-4 @min-sm:grid-cols-2">
					<a
						href="/virtualization"
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-800 active:scale-95"
					>
						View Example
					</a>

					<GithubLink
						href="https://github.com/abdel-17/svelte-file-tree/sites/preview/src/routes/virtualization/+page.svelte"
					>
						View Code
					</GithubLink>
				</div>
			</section>
		</div>
	</section>

	<section class="text-center">
		<GithubLink href="https://github.com/abdel-17/svelte-file-tree">View on GitHub</GithubLink>
	</section>
</main>
