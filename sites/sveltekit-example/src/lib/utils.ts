export type ArtificialDelayOptions = {
	minDelay?: number;
	maxDelay?: number;
};

export const artificialDelay = async (options: ArtificialDelayOptions = {}): Promise<void> => {
	const { minDelay = 500, maxDelay = 2000 } = options;
	const delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay + 1));
	await new Promise((resolve) => setTimeout(resolve, delay));
};

export type MaybeThrowErrorOptions = {
	chance?: number;
	message?: string;
};

export const maybeThrowError = (options: MaybeThrowErrorOptions = {}): void => {
	const { chance = 0.2, message = "maybeThrowError()" } = options;
	if (Math.random() < chance) {
		throw new Error(message);
	}
};
