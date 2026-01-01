import {createLoading, type CreateLoadingOptions, type Loading} from "./create-loading";
import {useEffect, useRef} from "react";

export const useCreateLocalLoading = <Errors extends unknown[] = string[], Context extends Record<string, unknown> = any>(createLoadingOptions: CreateLoadingOptions|CreateLoadingOptions['initialState'] = {}): Loading<Errors, Context> => {
    const loading = useRef(createLoading<Errors, Context>(typeof createLoadingOptions === "string" ? {
        initialState: createLoadingOptions
    } : createLoadingOptions));

    useEffect(() => {
        return () => {
            loading.current.destroy()
        }
    }, []);

    return loading.current;
}
