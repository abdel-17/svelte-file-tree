# svelte-file-tree

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
