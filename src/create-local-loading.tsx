import {createLoading, type CreateLoadingOptions, type Loading} from "./create-loading";
import {useEffect, useRef} from "react";

const create = <Errors extends unknown[] = string[], Context extends Record<string, unknown> = any>(createLoadingOptions: CreateLoadingOptions|CreateLoadingOptions['initialState']) => createLoading<Errors, Context>(typeof createLoadingOptions === "string" ? {
    initialState: createLoadingOptions
} : createLoadingOptions);

export const useCreateLocalLoading = <Errors extends unknown[] = string[], Context extends Record<string, unknown> = any>(createLoadingOptions: CreateLoadingOptions|CreateLoadingOptions['initialState'] = {}): Loading<Errors, Context> => {
    const loading = useRef<ReturnType<typeof create<Errors, Context>>>(undefined!);

    if (!loading.current) {
        loading.current = create<Errors, Context>(createLoadingOptions);
    }

    useEffect(() => {
        return () => {
            loading.current.destroy();
            loading.current = undefined!;
        }
    }, []);

    return loading.current;
}
