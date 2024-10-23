export function withEffectRoot(fn: () => void): () => void {
	return () => {
		const cleanup = $effect.root(fn);
		cleanup();
	};
}
