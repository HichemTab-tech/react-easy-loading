import * as React from 'react';
import {
    createLoading,
    type LoadingState,
    registerDefaultFallback,
    registerFallback
} from 'react-easy-loading';
import {useState} from "react";
import {expose} from "react-exposed-states";
import {useEffectSkipFirst} from "use-effect-skip-first";

const userLoading = createLoading<["error"]>({
    defaultFallback: <>default loading</>
});

declare module 'react-easy-loading'{
    // noinspection JSUnusedGlobalSymbols
    export interface FallbackRegistry{
        myFallback: never;
    }
}

registerFallback("myFallback", <div className="bg-blue-500 text-white">LOADING myFallback</div>)
registerDefaultFallback(<div className="bg-blue-500 text-white">GLOBAL DEFAULT LOADING</div>)

const simulatedPromiseFactory = (toBeSuccessful: boolean) => async () => new Promise<void>((resolve, reject) => {
    console.log("Simulated promise started");
    setTimeout(() => {
        console.log("Simulated promise finished");
        if (toBeSuccessful) resolve();
        else reject("ERROR BROTHER");
    }, 2000);
});

const {then, catch_, start} = userLoading.wrapWithControl(simulatedPromiseFactory(false));

then(() => console.log("MY THEN"));
catch_((e) => console.log("MY CATCH", e));

const Component = () => {
    const [test,] = expose(useState<LoadingState>("idle"), "loading");
    const state = userLoading.use();

    useEffectSkipFirst(() => {
        userLoading.set(test);
    }, [test]);

    const handle = async () => {
        start().then(() => console.log("LAST"));
    }

    const handle2 = async () => {
        userLoading.whenLoaded().then(() => console.log("when is here")).catch((e) => console.log("when is here with error", e));
    }

    return (
        <div>
            <p>state: {state}</p>
            <button onClick={handle}>Click me</button>
            <button onClick={handle2}>Click me2</button>
        </div>
    )
}

const App = () => {



    return (
        <div>
            <h1 className="text-red-600">React Easy Loading Demo</h1>
            <Component/>

            <userLoading.ShowWhenFinish>
                <h3>DONE</h3>
            </userLoading.ShowWhenFinish>
            <userLoading.ShowWhenLoaded fallback="myFallback" errorFallback>
                <h3>User Loaded!!</h3>
            </userLoading.ShowWhenLoaded>
            <userLoading.ShowWhenError>
                <h3>Error</h3>
            </userLoading.ShowWhenError>
            <userLoading.ShowWhenError>
                {(errors) => (
                    <div>
                        {errors.map((e) => <p key={e}>{e}</p>)}
                    </div>
                )}
            </userLoading.ShowWhenError>
        </div>
    );
};

export default App;
