# svelte-file-tree

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
