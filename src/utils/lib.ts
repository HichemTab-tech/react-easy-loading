/**
 * Represents a type that can be either a single instance of type `T` or an array of instances of type `T`.
 *
 * This type is useful in scenarios where a value may come as a single item or as a collection of items,
 * providing flexibility in handling both cases seamlessly.
 *
 * @template T The type of the element(s).
 */
export type AOS<T = any> = T | T[];

export const aosEquals = <T>(needle: T, aos: AOS<T>) => {
    return (Array.isArray(aos) && aos.includes(needle)) || needle === aos;
}
