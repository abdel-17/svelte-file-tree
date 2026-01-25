<script lang="ts">
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

	type TreeNode = {
		id: string;
		name: string;
		children?: TreeNode[];
	};

	function create_node(name: string, children?: TreeNode[]): TreeNode {
		return { id: crypto.randomUUID(), name, children };
	}

	const root = Array(10_000)
		.fill(null)
		.map((_, i) => {
			let children;
			if (i % 100 === 0) {
				children = Array(1000)
					.fill(null)
					.map((_, j) => create_node(`Item ${i + 1}.${j + 1}`));
			}
			return create_node(`Item ${i + 1}`, children);
		});

	const expanded_ids = new SvelteSet<string>();

	type VirtualItem = {
		item: TreeItemState<TreeNode>;
		start: number;
		height: number;
	};

	let scroll_element: HTMLDivElement | null = $state.raw(null);
	let tree: Tree<TreeNode> | null = $state.raw(null);
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

	function on_focus(item: TreeItemState<TreeNode>) {
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

	function on_toggle_click(event: MouseEvent, item: TreeItemState<TreeNode>) {
		if (item.expanded) {
			expanded_ids.delete(item.id);
		} else {
			expanded_ids.add(item.id);
		}
		event.preventDefault();
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
			{@const children = item.node.children}
			<TreeItem
				{item}
				class="group absolute top-0 right-0 left-0 p-3 hover:bg-neutral-200 focus:outline-2 focus:-outline-offset-2 focus:outline-current active:bg-neutral-300 aria-selected:bg-blue-200 aria-selected:text-blue-900 aria-selected:active:bg-blue-300"
				style="height: {height}px; transform: translateY({start}px);"
			>
				<div
					class="flex items-center"
					style="padding-inline-start: calc({6 * item.depth} * var(--spacing))"
				>
					<ChevronDownIcon
						role="presentation"
						data-visible={children !== undefined && children.length !== 0}
						class="size-6 p-0.5 transition-transform duration-200 group-aria-expanded:-rotate-90 data-[visible=false]:invisible"
						onclick={(event) => on_toggle_click(event, item)}
					/>

					<div class="ps-1 pe-2">
						{#if children !== undefined && item.expanded}
							<FolderOpenIcon role="presentation" class="fill-blue-300" />
						{:else if children !== undefined}
							<FolderIcon role="presentation" class="fill-blue-300" />
						{:else}
							<FileIcon role="presentation" />
						{/if}
					</div>

					<span class="select-none">{item.node.name}</span>
				</div>
			</TreeItem>
		{/each}
	</Tree>
</div>
