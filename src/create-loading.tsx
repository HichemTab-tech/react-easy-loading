import {createSharedState, sharedStatesApi, useSharedStateSelector} from "react-shared-states";
import React, {type PropsWithChildren, type ReactNode} from "react";
import {type AOS, aosEquals} from "./utils/lib";
import {reactNodeOrFunctionValue, resolveErrorFallback, resolveLoadingFallback} from "./fallbacks";

export type LoadingState = "idle" | "loading" | "success" | "error";
export type LoadingSharedState<Errors extends unknown[] = string[], Context extends Record<string, unknown> = any> = {
    state: LoadingState;
    errors?: Errors;
    context?: Context;
    retry?: () => void;
}

export type WrappedPromiseReturn<T> = {
    then: WrappedPromise<Promise<T>['then']>;
    catch_: WrappedPromise<Promise<T>['catch']>;
    finally_: WrappedPromise<Promise<T>['finally']>;
    start: () => Promise<T>;
}

export type ReactNodeOrFunction<T extends unknown[]> = ReactNode | ((...args: T) => ReactNode);

export type ExtractPromiseParameters<T> = T extends (...args: infer P) => Promise<unknown> ? P : never;
export type PromiseFunctionWithCustomReturn<T, R> = (...args: ExtractPromiseParameters<T>) => R;
export type WrappedPromise<T> = PromiseFunctionWithCustomReturn<T, WrappedPromiseReturn<T>>;
export type Loading<Errors extends unknown[] = string[], Context extends Record<string, unknown> = any> = {
    //hooks
    use: () => LoadingState;
    useIsLoading: () => boolean;
    useErrors: () => Errors | undefined;
    useContext: () => Context | undefined;
    // getters
    isLoading: () => boolean;
    isIdle: () => boolean;
    isSuccess: () => boolean;
    isError: () => boolean;
    isFinished: () => boolean;
    is: (s: LoadingState | LoadingState[]) => boolean;
    hasErrors: () => boolean;
    get: () => LoadingState;
    getErrors: () => Errors | undefined;
    getContext: () => Context | undefined;
    // setters
    set(state: LoadingState): void;
    retry: () => void;
    reset: () => void;
    addError: (error: Errors[number]) => void;
    setContext: (context: Context) => void;
    setErrors: (errors: Errors) => void;
    clearErrors: () => void;
    // add a retry function
    setRetry: (retry: () => void) => void;
    // promises
    whenLoaded: () => Promise<void>;
    whenFinished: () => Promise<void>;
    // wrap a promise
    wrap: <T>(asyncFn: () => Promise<T>) => Promise<T>;
    wrapWithControl: <T>(asyncFn: () => Promise<T>) => WrappedPromiseReturn<T>;
    // components
    // - show when
    ShowWhenLoaded: React.FC<PropsWithChildren<{
        fallback?: React.ReactNode;
        errorFallback?: ReactNodeOrFunction<[errors: Errors, retry: () => void]>;
    }>>;
    ShowWhileLoading: React.FC<PropsWithChildren>;
    ShowWhenError: React.FC<{
        children?: ReactNodeOrFunction<[errors: Errors, retry: () => void]> | undefined;
    }>;
    ShowWhenFinish: React.FC<{
        children?: ReactNodeOrFunction<[errors: Errors | undefined, retry: (() => void) | undefined]> | undefined;
    }>;
    ShowWhen: React.FC<PropsWithChildren<{ state: LoadingState }>>;
}

export type CreateLoadingOptions = {
    initialState?: LoadingState;
    defaultFallback?: React.ReactNode;
    defaultErrorFallback?: React.ReactNode;
    defaultRetry?: () => void;
}

// noinspection JSUnusedGlobalSymbols
export const createLoading = <Errors extends unknown[] = string[], Context extends Record<string, unknown> = any>({
                                                                                                                      initialState = "loading",
                                                                                                                      defaultFallback,
                                                                                                                      defaultErrorFallback,
                                                                                                                      defaultRetry
                                                                                                                  }: CreateLoadingOptions = {}): Loading<Errors, Context> => {
    const sharedState = createSharedState<LoadingSharedState<Errors, Context>>({
        state: initialState,
        retry: defaultRetry,
    });

    const when = (whenWhat: AOS<LoadingState>) => {
        let lastState = loading.get();
        return new Promise<void>((resolve, reject) => {
            if (aosEquals(loading.get(), whenWhat)) {
                resolve();
                return;
            }
            const unsubscribe = sharedStatesApi.subscribe(sharedState, () => {
                if (aosEquals(loading.get(), whenWhat)) {
                    unsubscribe();
                    resolve();
                } else {
                    if (lastState !== loading.get()) reject();
                }
            });
        });
    }

    const showWhenFactory = function <Args extends unknown[] = never>(state: AOS<LoadingState>, getArgs = () => [] as unknown as Args) {
        return (props: {
            children?: ReactNode | undefined | ((...args: Args) => ReactNode);
        }) => {
            const is = useSharedStateSelector(sharedState, (ss) => aosEquals(ss.state, state));

            if (!is) {
                return null;
            }

            return <>{reactNodeOrFunctionValue(props.children, ...getArgs())}</>
        }
    }

    const loading: Loading<Errors, Context> = {
        //hooks
        use: () => useSharedStateSelector(sharedState, (ss) => ss.state),
        useIsLoading: () => useSharedStateSelector(sharedState, (ss) => ss.state) === "loading",
        useErrors: () => useSharedStateSelector(sharedState, (ss) => ss.errors),
        useContext: () => useSharedStateSelector(sharedState, (ss) => ss.context),
        set: (state) => sharedStatesApi.update(sharedState, (s) => ({...s, state})),
        retry: () => sharedStatesApi.get(sharedState).retry?.(),
        // getters
        isLoading: () => sharedStatesApi.get(sharedState).state === "loading",
        isIdle: () => sharedStatesApi.get(sharedState).state === "idle",
        isSuccess: () => sharedStatesApi.get(sharedState).state === "success",
        isError: () => sharedStatesApi.get(sharedState).state === "error",
        isFinished: () => sharedStatesApi.get(sharedState).state === "success" || sharedStatesApi.get(sharedState).state === "error",
        is: (s: LoadingState | LoadingState[]) => aosEquals(loading.get(), s),
        hasErrors: () => sharedStatesApi.get(sharedState).errors !== undefined,
        get: () => sharedStatesApi.get(sharedState).state,
        getErrors: () => sharedStatesApi.get(sharedState).errors,
        getContext: () => sharedStatesApi.get(sharedState).context,
        // setters
        reset: () => sharedStatesApi.set(sharedState, {
            state: initialState,
        }),
        addError: (error) => {
            sharedStatesApi.update(sharedState, (s) => ({
                ...s,
                errors: [...(s.errors ?? []), error] as Errors
            }));
        },
        setContext: (context) => {
            sharedStatesApi.update(sharedState, (s) => ({...s, context}));
        },
        setErrors: (errors) => {
            sharedStatesApi.update(sharedState, (s) => ({...s, errors}));
        },
        clearErrors: () => {
            sharedStatesApi.update(sharedState, (s) => ({...s, errors: undefined}));
        },
        // set a retry function
        setRetry: (retry) => sharedStatesApi.update(sharedState, (s) => ({...s, retry})),
        // promises
        whenLoaded: () => when("success").catch((e) => {
            throw new Error("loading failed", {cause: e})
        }),
        whenFinished: () => when(["success", "error"]),
        // wrap a promise
        wrap<T>(asyncFn: () => Promise<T>) {
            const retry = () => new Promise<T>((resolve, reject) => {
                loading.clearErrors();
                loading.set("loading");
                asyncFn().then((r) => {
                    loading.set("success");
                    resolve(r);
                }).catch((e) => {
                    loading.set("error");
                    if (e) loading.setErrors([e] as Errors)
                    reject(e);
                });
            });
            loading.setRetry(retry);
            return retry();
        },
        wrapWithControl<T>(asyncFn: () => Promise<T>): WrappedPromiseReturn<T> {
            const handlers: {
                thens: Parameters<Promise<T>['then']>[];
                catchs: Parameters<Promise<T>['catch']>[];
                finallies: Parameters<Promise<T>['finally']>[];
            } = {
                thens: [],
                catchs: [],
                finallies: []
            }

            // noinspection JSUnusedGlobalSymbols
            const control: WrappedPromiseReturn<T> = {
                then: (...args: Parameters<Promise<T>['then']>) => {
                    handlers.thens.push(args);
                    return control;
                },
                catch_: (...args: Parameters<Promise<T>['catch']>) => {
                    handlers.catchs.push(args);
                    return control;
                },
                finally_: (...args: Parameters<Promise<T>['finally']>) => {
                    handlers.finallies.push(args);
                    return control;
                },
                start: () => {
                    return new Promise<T>((resolve, reject) => {
                        loading.clearErrors();
                        loading.set("loading");
                        let chained = asyncFn();
                        chained.then(() => {
                            loading.set("success");
                        });
                        chained.catch((e) => {
                            loading.set("error");
                            if (e) loading.setErrors([e] as Errors)
                        });
                        for (const args of handlers.thens) {
                            chained.then(...args);
                        }
                        for (const args of handlers.catchs) {
                            chained.catch(...args);
                        }
                        for (const args of handlers.finallies) {
                            chained.finally(...args);
                        }
                        chained.then(resolve, reject);
                    });
                }
            } as WrappedPromiseReturn<T>;

            loading.setRetry(control.start);

            return control;
        },
        // components
        // - show when
        ShowWhenLoaded: ({children, fallback, errorFallback}) => {
            const state = useSharedStateSelector(sharedState, (ss) => ss.state);

            if (state === "idle") return null;


            fallback = resolveLoadingFallback(defaultFallback, fallback) as ReactNode;
            errorFallback = resolveErrorFallback(defaultErrorFallback, errorFallback === true ? undefined : errorFallback);

            if (state === "loading") {
                return <>{fallback}</>;
            }

            if (state === "error") {
                return <>{reactNodeOrFunctionValue(errorFallback, ...[(loading.getErrors() ?? []) as Errors, () => loading.retry()])}</>;
            }

            return <>{children}</>
        },
        ShowWhileLoading: showWhenFactory("loading"),
        ShowWhenError: showWhenFactory("error", () => [(loading.getErrors() ?? []) as Errors, () => loading.retry()]),
        ShowWhenFinish: showWhenFactory(["error", "success"], () => [loading.getErrors(), () => loading.retry()]),
        ShowWhen: ({children, state}: PropsWithChildren<{ state: LoadingState }>) => {
            const Component = showWhenFactory(state);
            return <Component>{children}</Component>
        },
    }

    return loading;
}
