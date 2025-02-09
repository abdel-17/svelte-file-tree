import type { HTMLAttributes } from "svelte/elements";

export type HTMLDivAttributes = HTMLAttributes<HTMLDivElement>;

export type MaybePromise<T> = T | Promise<T>;
