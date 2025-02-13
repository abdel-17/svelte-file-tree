import * as v from "valibot";

export const IntSchema = v.pipe(v.number(), v.integer());

export const TimestampSchema = v.pipe(
	v.string(),
	v.transform((date) => new Date(date)),
);
