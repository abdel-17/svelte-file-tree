<script lang="ts" module>
	import {
		defaultRangeExtractor,
		elementScroll,
		observeElementOffset,
		observeElementRect,
		Virtualizer,
		type ScrollToOptions,
		type VirtualizerOptions,
	} from "@tanstack/virtual-core";
	import { getContext, setContext } from "svelte";
	import type { FileNode, FolderNode, TreeItemState, DefaultTFolder } from "$lib/tree.svelte.js";
	import type { VirtualListItem, VirtualListProps } from "./types.js";

	export type VirtualListContext<
		TFile extends FileNode,
		TFolder extends FolderNode<TFile | TFolder>,
	> = {
		scrollToIndex: (index: number, options?: ScrollToOptions) => void;
		setVisibleItems: (value: Array<TreeItemState<TFile, TFolder>>) => void;
	};

	const CONTEXT_KEY = Symbol("VirtualListContext");

	export function getVirtualListContextIfExists<
		TFile extends FileNode,
		TFolder extends FolderNode<TFile | TFolder>,
	>(): VirtualListContext<TFile, TFolder> | undefined {
		return getContext(CONTEXT_KEY);
	}
</script>

<script
	lang="ts"
	generics="TFile extends FileNode = FileNode, TFolder extends FolderNode<TFile | TFolder> = DefaultTFolder<TFile>"
>
	let {
		children,
		estimateSize,
		rangeExtractor = defaultRangeExtractor,
		overscan = 1,
		paddingStart,
		paddingEnd,
		scrollPaddingStart,
		scrollPaddingEnd,
		scrollMargin,
		gap,
		ref = $bindable(null),
		...rest
	}: VirtualListProps<TFile, TFolder> = $props();

	let treeSize = $state.raw(0);
	let virtualItems: Array<VirtualListItem<TFile, TFolder>> = $state.raw([]);
	let visibleItems: Array<TreeItemState<TFile, TFolder>> = $state.raw([]);

	const options: VirtualizerOptions<HTMLElement, HTMLElement> = {
		count: 0,
		overscan,
		paddingStart,
		paddingEnd,
		scrollPaddingStart,
		scrollPaddingEnd,
		scrollMargin,
		gap,
		getScrollElement: () => ref,
		getItemKey: (order) => visibleItems[order]!.node.id,
		estimateSize: (order) => estimateSize(visibleItems[order]!, order),
		rangeExtractor: (range) => rangeExtractor(range),
		onChange: (instance) => {
			instance._willUpdate();
			treeSize = instance.getTotalSize();
			virtualItems = instance.getVirtualItems().map((virtualItem) => {
				const order = virtualItem.index;
				return {
					item: visibleItems[order]!,
					order,
					key: virtualItem.key as string,
					size: virtualItem.size,
					start: virtualItem.start,
					end: virtualItem.end,
				};
			});
		},
		scrollToFn: elementScroll,
		observeElementOffset,
		observeElementRect,
	};
	const virtualizer = new Virtualizer(options);

	export function getTreeSize() {
		return treeSize;
	}

	export function getVirtualItems() {
		return virtualItems;
	}

	export const { measure, scrollToIndex, scrollToOffset, scrollBy } = virtualizer;

	const context: VirtualListContext<TFile, TFolder> = {
		scrollToIndex,
		setVisibleItems: (value) => {
			visibleItems = value;
		},
	};
	setContext(CONTEXT_KEY, context);

	$effect(() => {
		const cleanup = virtualizer._didMount();
		virtualizer._willUpdate();
		return cleanup;
	});

	$effect(() => {
		options.count = visibleItems.length;
		options.overscan = overscan;
		options.paddingStart = paddingStart;
		options.paddingEnd = paddingEnd;
		options.scrollPaddingStart = scrollPaddingStart;
		options.scrollPaddingEnd = scrollPaddingEnd;
		options.scrollMargin = scrollMargin;
		options.gap = gap;
		virtualizer.setOptions(options);
		measure();
	});
</script>

<div {...rest} bind:this={ref}>
	{@render children({ treeSize, virtualItems })}
</div>
