import React from "react";
import type {ReactNodeOrFunction} from "./create-loading";

export interface FallbackRegistry {
    [k: string]: never
}

export interface ErrorFallbackRegistry {
    [k: string]: never
}

export const fallbacks: Record<keyof FallbackRegistry, React.ReactNode> = {};

export const errorFallbacks: Record<keyof ErrorFallbackRegistry, React.ReactNode> = {};

// noinspection JSUnusedGlobalSymbols
export const registerFallback = (key: keyof FallbackRegistry, component: React.ReactNode) => {
    fallbacks[key] = component;
}

// noinspection JSUnusedGlobalSymbols
export const registerErrorFallback = (key: keyof ErrorFallbackRegistry, component: React.ReactNode) => {
    errorFallbacks[key] = component;
}

let DEFAULT_FALLBACK: React.ReactNode = <div>Loading...</div>;

let DEFAULT_ERROR_FALLBACK: ReactNodeOrFunction<[errors: string[] | undefined, retry: (() => void) | undefined]> = (errors, retry) => (
    <div>
        <h3>Errors:</h3>
        <ul>
            {errors?.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
        <button onClick={retry} disabled={!retry}>Retry</button>
    </div>
);

// noinspection JSUnusedGlobalSymbols
export const registerDefaultFallback = (component: React.ReactNode) => {
    DEFAULT_FALLBACK = component;
}

// noinspection JSUnusedGlobalSymbols
export const registerDefaultErrorFallback = (component: React.ReactNode) => {
    DEFAULT_ERROR_FALLBACK = component;
}

export const getDefaultFallback = () => DEFAULT_FALLBACK;

export const getDefaultErrorFallback = () => DEFAULT_ERROR_FALLBACK;


/**
 * @internal
 * @param defaultFallback
 * @param propFallback
 */
export const resolveLoadingFallback = (
    defaultFallback?: React.ReactNode,
    propFallback?: React.ReactNode,
) => {
    return resolveFallback(getDefaultFallback, fallbacks, defaultFallback, propFallback)
}

/**
 * @internal
 * @param defaultFallback
 * @param propFallback
 */
export function resolveErrorFallback <Errors>(
    defaultFallback?: ReactNodeOrFunction<[errors: Errors, retry: () => void]>,
    propFallback?: ReactNodeOrFunction<[errors: Errors, retry: () => void]>,
) {
    return resolveFallback<[errors: Errors, retry: () => void]>(getDefaultErrorFallback as () => ReactNodeOrFunction<[errors: Errors, retry: () => void]>, errorFallbacks, defaultFallback as unknown as ReactNodeOrFunction<[errors: Errors, retry: () => void]>, propFallback)
}

function resolveFallback<Args extends unknown[] = unknown[]>(
    defaultGlobalFallback: () => ReactNodeOrFunction<Args>,
    registry: Record<string, ReactNodeOrFunction<Args>>,
    defaultFallback?: ReactNodeOrFunction<Args>,
    propFallback?: ReactNodeOrFunction<Args>,
) {
    if (propFallback) {
        if (typeof propFallback === "string") {
            return registry[propFallback] ?? propFallback;
        }
        else {
            return propFallback;
        }
    }
    else{
        if (propFallback === null) return null;
    }
    if (defaultFallback) {
        if (typeof defaultFallback === "string") {
            return registry[defaultFallback] ?? defaultFallback;
        }
        else {
            return defaultFallback;
        }
    }

    return defaultGlobalFallback();
}

export function reactNodeOrFunctionValue<Args extends unknown[] = unknown[]>(r: ReactNodeOrFunction<Args>, ...args: Args): React.ReactNode {
    if (typeof r === "function") {
        return r(...args);
    }
    return r;
}
