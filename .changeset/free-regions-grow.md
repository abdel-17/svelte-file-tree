---
"svelte-file-tree": minor
---

feat: add virtualization
feat: add `isItemHidden` prop to control item visibility
feat: add `TreeItemState.order` property, which is the render index of the item in the tree
breaking: `TreeProps.isItemDisabled` must be a function
breaking: remove `TreeProps.onClipboardChange`
breaking: remove `TreeProps.onChildrenChange`
breaking: remove `Tree.copyToClipboard` method
