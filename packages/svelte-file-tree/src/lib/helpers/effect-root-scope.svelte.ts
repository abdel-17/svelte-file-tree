export function effectRootScope(scope: () => void): void {
	const cleanup = $effect.root(scope);
	cleanup();
}
