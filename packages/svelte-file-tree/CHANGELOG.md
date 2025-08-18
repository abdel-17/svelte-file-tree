# svelte-file-tree

## 0.11.0

### Minor Changes

- 1063795:
  feat: add virtualization
  feat: add `isItemHidden` prop to control item visibility
  feat: add `TreeItemState.order` property, which is the render index of the item in the tree
  breaking: `TreeProps.isItemDisabled` must be a function
  breaking: remove `TreeProps.onClipboardChange`
  breaking: remove `TreeProps.onChildrenChange`
  breaking: remove `Tree.copyToClipboard` method
- 80a4ba6: feat: add `canDrag` and `canDrop` props to `Tree`

## 0.10.0

### Minor Changes

- 9cf6ba1: feat: expose an option to disable batching in tree methods

## 0.9.2

### Patch Changes

- d686683: fix: focused item not deleted if it's not selected

## 0.9.1

### Patch Changes

- 6f90b65: fix: allow destructuring `source` and `items` in drag and drop callbacks

## 0.9.0

### Minor Changes

- e4e8198: breaking: rework drag and drop callbacks (https://github.com/abdel-17/svelte-file-tree/pull/70)

## 0.8.0

### Minor Changes

- feat: pass `copies` to `onCopy` and `canCopy` callbacks.
- feat: add prop `TreeProps.defaultClipboardIds`.
- feat: add prop `TreeProps.clipboardIds`.
- feat: add bindable prop `TreeProps.pasteOperation`.
- breaking: remove prop `TreeProps.clipboard`.
- breaking: `TreeProps.onClipboardChange` callback now receives `clipboardIds` and `pasteOperation` instead of `clipboard`.
- fix: `TreeProps.onClipboardChange` was previously not always called when the clipboard changes.

## 0.7.0

### Minor Changes

- feat: add `FileTree` class
- feat: add `TreeItemState.type` property (always equal to "item")
- breaking: change the type of `TreeProps.root` to `FileTree`.
- breaking: change the type of any `destination` property from `FolderNode` to `FolderNode | FileTree`.

## 0.6.0

### Patch Changes

- feat: make `FileNode.id` and `FolderNode.id` writable

## 0.5.0

### Minor Changes

- feat: add `Tree.getItems()` method

## 0.4.0

### Minor Changes

- breaking: Tree.copyToClipboard() and Tree.remove() methods now receive an itemId parameter instead of an item.
- breaking: TreeClipboard.ids is now a SvelteSet instead of a Set.

## 0.3.0

### Minor Changes

- 565712c: Rework
  https://github.com/abdel-17/svelte-file-tree/pull/70

## 0.2.0

### Minor Changes

- feat: add `copyNode` prop to customize copy behavior
- feat: add `count` property to `FileTree`, `FileNode`, and `FolderNode`
- breaking: remove `generateCopyId` and `isItemEditable` props
- breaking: remove `editable` property from `TreeItemState`
- breaking: remove `TreeItemInput` component

## 0.1.0

### Minor Changes

- c4b1d19: Add Change Callbacks

## 0.0.1

### Patch Changes

- b268a2b: Initial Version
