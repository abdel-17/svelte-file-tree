export type MaybeThrowErrorOptions = {
	chance?: number;
	message?: string;
};

export const maybeThrowError = ({
	chance = 0.1,
	message = "maybeThrowError()",
}: MaybeThrowErrorOptions = {}): void => {
	if (Math.random() < chance) {
		throw new Error(message);
	}
};
