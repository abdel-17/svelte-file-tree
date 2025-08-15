<script lang="ts" module>
	import {
		elementScroll,
		observeElementOffset,
		observeElementRect,
		Virtualizer,
		type ScrollToOptions,
		type VirtualItem,
		type VirtualizerOptions,
	} from "@tanstack/virtual-core";
	import { getContext, setContext } from "svelte";
	import { FileNode, FolderNode, TreeItemState, type DefaultTFolder } from "$lib/tree.svelte.js";
	import type { VirtualListProps } from "./types.js";

	export type VirtualListContext<
		TFile extends FileNode,
		TFolder extends FolderNode<TFile | TFolder>,
	> = {
		scrollToIndex: (index: number, options?: ScrollToOptions) => void;
		setItems: (value: Array<TreeItemState<TFile, TFolder>>) => void;
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
		overscan = 1,
		paddingStart,
		paddingEnd,
		scrollPaddingStart,
		scrollPaddingEnd,
		scrollMargin,
		gap,
		ref = $bindable(null),
		...rest
	}: VirtualListProps = $props();

	let treeSize = $state.raw(0);
	let virtualItems: Array<VirtualItem> = $state.raw([]);
	let items: Array<TreeItemState<TFile, TFolder>> = $state.raw([]);

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
		getItemKey: (index) => items[index]!.node.id,
		estimateSize: (index) => {
			const item = items[index]!;
			if (!item.visible) {
				return 0;
			}
			return estimateSize(item, index);
		},
		onChange: (instance) => {
			instance._willUpdate();
			treeSize = instance.getTotalSize();
			virtualItems = instance.getVirtualItems();
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

	export const { scrollToIndex, scrollToOffset, scrollBy } = virtualizer;

	const context: VirtualListContext<TFile, TFolder> = {
		scrollToIndex,
		setItems: (value) => {
			items = value;
		},
	};
	setContext(CONTEXT_KEY, context);

	$effect(() => {
		const cleanup = virtualizer._didMount();
		virtualizer._willUpdate();
		return cleanup;
	});

	$effect(() => {
		options.count = items.length;
		options.overscan = overscan;
		options.paddingStart = paddingStart;
		options.paddingEnd = paddingEnd;
		options.scrollPaddingStart = scrollPaddingStart;
		options.scrollPaddingEnd = scrollPaddingEnd;
		options.scrollMargin = scrollMargin;
		options.gap = gap;
		virtualizer.setOptions(options);
		virtualizer.measure();
	});
</script>

<div {...rest} bind:this={ref}>
	{@render children({ treeSize, virtualItems })}
</div>
