<script lang="ts">
	// @ts-nocheck
	import { Node } from "$lib/tree.svelte.js";
	import { SvelteSet } from "svelte/reactivity";

	const root = $state(
		Array(5000)
			.fill(null)
			.map((_, i) => {
				let children;
				if (i % 100 === 0) {
					children = Array(1000)
						.fill(null)
						.map((_, j) => new Node(`Item ${i + 1}.${j + 1}`));
				}
				return new Node(`Item ${i + 1}`, children);
			}),
	);

	const expanded_ids = new SvelteSet();

	export class TreeItemData {
		constructor(props) {
			this.id = props.id;
			this.elementId = props.elementId;
			this.index = props.index;
			this.data = props.data;
			this.depth = props.parent === undefined ? 0 : props.parent.depth + 1;
			this.parent = props.parent;
			this.parentChildren = props.parentChildren;
			this.indexInChildren = props.indexInChildren;
			this.expanded = props.expanded;
			this.selected = $derived.by(props.selected);
			this.inClipboard = $derived.by(props.inClipboard);
			this.disabled = $derived.by(props.disabled);
			this.hasChildren = $derived.by(props.hasChildren);
		}

		first(predicate) {
			let item = this;
			do {
				if (predicate(item)) {
					break;
				}
				item = item.parent;
			} while (item !== undefined);
			return item;
		}
	}

	function flatten(children, parent, result) {
		for (let i = 0; i < children.length; i++) {
			const data = children[i];
			const item = new TreeItemData({
				id: data.id,
				elementId: `${data.id}`,
				index: result.length,
				data,
				parent,
				parentChildren: children,
				indexInChildren: i,
				expanded: expanded_ids.has(data.id),
			});
			result.push(item);

			if (item.expanded) {
				if (data.children !== undefined) {
					flatten(data.children, item, result);
				}
			}
		}
		return result;
	}

	let start = performance.now();
	let result = flatten(root, undefined, []);
	console.log(performance.now() - start, result);

	start = performance.now();
	for (const item of root) {
		expanded_ids.add(item.id);
	}
	console.log(performance.now() - start);

	start = performance.now();
	result = flatten(root, undefined, []);
	console.log(performance.now() - start, result);
</script>
