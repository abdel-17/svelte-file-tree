import type { HTMLAttributes } from "svelte/elements";

export type HTMLDivAttributes = HTMLAttributes<HTMLDivElement>;

export type MaybePromise<T> = T | Promise<T>;

export type ResolvableTo<T, TArgs extends unknown[]> = T | ((...args: TArgs) => T);
