import type {Loading, ReactNodeOrFunction} from "../create-loading";
import React, {type PropsWithChildren, type ReactNode} from "react";
import {
    reactNodeOrFunctionValue,
    resolveErrorFallback,
    resolveLoadingFallback
} from "../fallbacks";

interface AllLoadedProps {
    of: Loading[],
    fallback?: React.ReactNode;
    errorFallback?: ReactNodeOrFunction<[errors: any[] | undefined, retry: (() => void) | undefined]>;
}

// noinspection JSUnusedGlobalSymbols
export const AllLoaded = ({of, fallback, errorFallback, children}: PropsWithChildren<AllLoadedProps>) => {

    const iss = of.map(l => l.use());
    fallback = resolveLoadingFallback(undefined, fallback) as ReactNode;

    if (iss.some(l => l==="loading")) {
        return fallback;
    }

    if (iss.every(l => l!=="loading")) {
        if (iss.some(l => l==="error")) {
            errorFallback = resolveErrorFallback(undefined, errorFallback) as NonNullable<AllLoadedProps['errorFallback']>;

            return <>{reactNodeOrFunctionValue(
                errorFallback,
                ...[
                    of.reduce((prev, cur) => [...prev, ...(cur.getErrors()??[])], [] as unknown[]),
                    () => {
                        of.map(l => {
                            if (l.isError()) l.retry()
                        })
                    }
                ]
            )}</>
        }
        else{
            return <>{children}</>
        }
    }

    return null;
}
