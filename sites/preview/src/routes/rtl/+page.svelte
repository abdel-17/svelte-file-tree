<script lang="ts">
	import Tree from "$lib/Tree.svelte";
	import TreeItem from "$lib/TreeItem.svelte";
	import { FileNode, FileTree, FolderNode, type FileTreeNode } from "$lib/tree.svelte.js";

	const KB = 1024;
	const MB = 1024 * KB;
	const GB = 1024 * MB;

	function createFile(name: string, size: number) {
		return new FileNode({
			id: crypto.randomUUID(),
			name,
			size,
		});
	}

	function createFolder(name: string, children: Array<FileTreeNode>) {
		return new FolderNode({
			id: crypto.randomUUID(),
			name,
			children,
		});
	}

	// prettier-ignore
	const root = new FileTree([
		createFolder("التطبيقات", [
			createFile("متجر التطبيقات.app", 50 * MB),
			createFile("فيس تايم.app", 30 * MB),
			createFile("البريد.app", 20 * MB),
			createFile("الرسائل.app", 35 * MB),
			createFile("الموسيقى.app", 100 * MB),
			createFile("سفاري.app", 70 * MB),
		]),
		createFolder("المستندات", [
			createFolder("تخطيط المشروع", [
				createFile("أهداف الربع الأول.xlsx", 10 * MB),
				createFile("الجدول الزمني.pdf", 20 * MB),
			]),
			createFile("ملاحظات الاجتماع.docx", 10 * MB),
			createFile("السيرة الذاتية.pdf", 10 * MB),
		]),
		createFolder("التنزيلات", [
			createFile("شرائح المؤتمر.pptx", 33 * MB),
			createFile("ملخص تايبسكريبت.pdf", 10 * MB),
		]),
		createFolder("الصور", [
			createFolder("لقطات الشاشة", [
				createFile("تقرير الأخطاء.png", 1 * MB),
				createFile("مخطط المكونات.png", 3 * MB),	
				createFile("نموذج التصميم.png", 2 * MB),
			]),
			createFile("صورة الملف الشخصي.jpg", 6 * MB),
		]),
		createFolder("مقاطع الفيديو", [
			createFile("رحلة العائلة.mp4", 300 * MB),
			createFile("البحث عن نيمو.mp4", 1.5 * GB),
		]),
	]);
</script>

<Tree {root} lang="ar" class="min-h-svh scroll-p-6 p-6">
	{#snippet children({ visibleItems })}
		{#each visibleItems as item, order (item.node.id)}
			<TreeItem {item} {order} />
		{/each}
	{/snippet}
</Tree>
