import {createLoading, type CreateLoadingOptions, type Loading} from "./create-loading";
import {useEffect, useRef} from "react";

export const useCreateLocalLoading = <Errors extends unknown[] = string[], Context extends Record<string, unknown> = any>(createLoadingOptions: CreateLoadingOptions = {}): Loading<Errors, Context> => {
    const loading = useRef(createLoading<Errors, Context>(createLoadingOptions));

    useEffect(() => {
        return () => {
            loading.current.destroy()
        }
    }, []);

    return loading.current;
}
