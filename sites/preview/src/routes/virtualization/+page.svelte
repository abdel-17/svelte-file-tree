<script lang="ts">
	import { TreeItemData } from "$lib/tree.svelte";
	import {
		elementScroll,
		observeElementOffset,
		observeElementRect,
		Virtualizer,
		type VirtualizerOptions,
	} from "@tanstack/virtual-core";
	import { ChevronDownIcon, FileIcon, FolderIcon, FolderOpenIcon } from "@lucide/svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { Tree, TreeItem, type TreeItemState } from "svelte-file-tree";

	const root = $state(
		Array(10_000)
			.fill(null)
			.map((_, i) => {
				let children;
				if (i % 100 === 0) {
					children = Array(1000)
						.fill(null)
						.map((_, j) => new TreeItemData(`Item ${i + 1}.${j + 1}`));
				}
				return new TreeItemData(`Item ${i + 1}`, children);
			}),
	);

	let tree: Tree<TreeItemData> | null = $state.raw(null);
	const expanded_ids = new SvelteSet<string>();

	function on_toggle_click(event: MouseEvent, item: TreeItemState<TreeItemData>) {
		if (item.expanded) {
			expanded_ids.delete(item.id);
		} else {
			expanded_ids.add(item.id);
		}
		event.preventDefault();
	}

	type VirtualItem = {
		item: TreeItemState<TreeItemData>;
		start: number;
		height: number;
	};

	let scroll_element: HTMLDivElement | null = $state.raw(null);
	let tree_height = $state.raw(0);
	let virtual_items: VirtualItem[] = $state.raw([]);

	const options: VirtualizerOptions<HTMLElement, HTMLElement> = {
		count: 0,
		overscan: 10,
		paddingStart: 24,
		paddingEnd: 24,
		getScrollElement: () => scroll_element,
		getItemKey: (index) => tree!.getItems()[index].id,
		estimateSize: () => 48,
		onChange: (instance) => {
			instance._willUpdate();
			tree_height = instance.getTotalSize();
			virtual_items = instance.getVirtualItems().map((item) => ({
				item: tree!.getItems()[item.index],
				start: item.start,
				height: item.size,
			}));
		},
		scrollToFn: elementScroll,
		observeElementOffset,
		observeElementRect,
	};
	const virtualizer = new Virtualizer(options);

	$effect(() => {
		const cleanup = virtualizer._didMount();
		virtualizer._willUpdate();
		return cleanup;
	});

	$effect(() => {
		options.count = tree!.getItems().length;
		virtualizer.setOptions(options);
		virtualizer.measure();
	});

	function on_focus(item: TreeItemState<TreeItemData>) {
		const element = document.getElementById(item.elementId);
		if (element !== null) {
			element.focus();
			return;
		}

		// Item not rendered yet, scroll to it.
		virtualizer.scrollToIndex(item.index);

		let retries = 0;
		requestAnimationFrame(function callback() {
			const element = document.getElementById(item.elementId);
			if (element !== null) {
				element.focus();
				return;
			}

			if (retries < 100) {
				retries++;
				requestAnimationFrame(callback);
			}
		});
	}
</script>

<div bind:this={scroll_element} class="h-svh overflow-y-auto">
	<Tree
		bind:this={tree}
		{root}
		expandedIds={expanded_ids}
		onFocus={on_focus}
		class="relative"
		style="height: {tree_height}px;"
	>
		{#each virtual_items as { item, height, start } (item.id)}
			{@const has_children = item.data.children !== undefined && item.data.children.length !== 0}
			<TreeItem
				{item}
				class="group absolute top-0 right-0 left-0 flex items-center p-3 hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300"
				style="
					height: {height}px;
					transform: translateY({start}px);
					padding-inline-start: calc({3 + 6 * item.depth} * var(--spacing));
				"
			>
				<ChevronDownIcon
					role="presentation"
					data-visible={has_children}
					class="size-6 p-0.5 transition-transform duration-200 group-aria-expanded:-rotate-90 data-[visible=false]:invisible"
					onclick={(event) => on_toggle_click(event, item)}
				/>

				<div class="ps-1 pe-2">
					{#if has_children && item.expanded}
						<FolderOpenIcon role="presentation" class="fill-blue-300" />
					{:else if has_children}
						<FolderIcon role="presentation" class="fill-blue-300" />
					{:else}
						<FileIcon role="presentation" />
					{/if}
				</div>

				<span class="select-none">{item.data.name}</span>
			</TreeItem>
		{/each}
	</Tree>
</div>
