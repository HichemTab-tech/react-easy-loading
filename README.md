# React Easy Loading

Simplify loading states across your React app with built-in status tracking and fallbacks.
This package provides a simple but powerful way to manage `idle`, `loading`, `success`,
and `error` states, removing boilerplate and making your code cleaner and more readable.

![react-easy-loading banner](assets/banner.png)

## Getting Started

Start by installing the package via your preferred package manager:

```sh
npm install react-easy-loading
```

or, if using pnpm:

```sh
pnpm add react-easy-loading
```

## ☕ 60-Second TL;DR

At its core, `react-easy-loading` lets you create a `loading` object that tracks the state of an operation. You can then use its components to conditionally render content.

Here's the simplest example:

```javascript
import { createLoading } from 'react-easy-loading';
import React, {useEffect} from 'react';

// 1. Create a loading instance
const userLoading = createLoading();

// 2. A function that returns a promise
const fetchUser = () => fetch('https://api.github.com/users/HichemTab-tech').then(res => res.json());

export default function Demo() {
  const [user, setUser] = React.useState(null);

  // 3. Set the loading state manually
  useEffect(() => {
    userLoading.set('loading');
    fetchUser()
      .then(user => {
        setUser(user);
        userLoading.set('success');
      })
      .catch(() => userLoading.set('error'));
  }, []);

  return (
    <div>
      {/* 4. Show content based on loading state */}
      <userLoading.ShowWhenLoaded fallback={<p>Loading user...</p>}>
        <h1>{user?.name}</h1>
      </userLoading.ShowWhenLoaded>
    </div>
  );
}
```

## Cross-Component State Tracking

Because `loading` instances are just exported objects,
you can share a single loading state across completely different parts of your application without prop-drilling.

**`src/loadings.js`**

```javascript
import { createLoading } from 'react-easy-loading';

// Create and export a loading instance
export const userProfileLoading = createLoading({ initialState: 'idle' });
```

**`src/components/ProfileHeader.js`**

```javascript
import { userProfileLoading } from '../loadings';

function ProfileHeader() {
  // Use a hook to reactively track the loading state
  const isLoading = userProfileLoading.useIsLoading();

  if (isLoading) {
    return <p>Updating header...</p>;
  }
  // ... render header
}
```

**`src/components/Avatar.js`**

```javascript
import { userProfileLoading } from '../loadings';

function Avatar() {
  // Use a component from the same instance to show a fallback
  return (
    <userProfileLoading.ShowWhenLoaded fallback={<AvatarSkeleton />}>
      <img src="..." alt="User Avatar" />
    </userProfileLoading.ShowWhenLoaded>
  );
}
```

## Local Loading State

Sometimes you want a loading state that is tied to the lifecycle of a component
(just like useState).
`useCreateLocalLoading` creates a loading instance that is automatically destroyed when the component unmounts.

```javascript
import { useCreateLocalLoading } from 'react-easy-loading';

function MyComponent() {
  const loading = useCreateLocalLoading();
  
  // Use it just like a regular loading instance
  const isLoading = loading.useIsLoading();

  return (
    <div>
      {isLoading ? 'Loading...' : 'Done'}
    </div>
  );
}
```

## ✨ Automatic State Management with `wrap`

The `wrap` function automates state management.
It takes an async function, sets the state to `loading` immediately,
and updates it to `success` or `error` when the promise settles.
It also automatically implements a `retry` function.

```javascript
const loadUser = () => {
  // This handles set('loading'), set('success'), set('error'), and setRetry()
  userLoading.wrap(fetchUser).then(setUser);
};
```

### Finer Control with `wrapWithControl`

For more complex scenarios, `wrapWithControl` lets you chain `.then()`, `.catch()`, and `.finally()` handlers *before* the async operation starts. The operation is only executed when you call `.start()`.

```javascript
const { then, catch_, start } = userLoading.wrapWithControl(fetchUser);

// Define extra custom handlers
then(user => console.log('User loaded:', user));
catch_(error => console.error('Failed to load user:', error));

// Later, in your event handler
const loadUser = () => {
  start().then(setUser); // The promise starts here
};
```

## Fallbacks and The Registry

A key benefit of `react-easy-loading` is its powerful fallback system.
You can define a library of reusable loading and error components and use them by name.

### How to Use the Registry

1.  **Register a named fallback**: Use `registerFallback` or `registerErrorFallback`.
2.  **Use it by name**: Pass the name to `createLoading` or the `fallback`/`errorFallback` prop.

This allows you to maintain a consistent look and feel for common UI states like inline spinners,
card loaders, or error modals.

**`src/fallbacks.js`**

```javascript
import { registerFallback, registerErrorFallback } from 'react-easy-loading';

const InlineSpinner = () => <span className="spinner-inline"></span>;
const CardLoader = () => <div className="card-skeleton"></div>;
const ErrorCard = ({ errors, retry }) => (
  <div className="error-card">
    <h4>Oops! Something went wrong.</h4>
    <p>{errors[0]?.message}</p>
    <button onClick={retry}>Try Again</button>
  </div>
);

// Register your components
registerFallback('inline', <InlineSpinner />);
registerFallback('card', <CardLoader />);
registerErrorFallback('defaultError', ErrorCard);
```

**`src/MyComponent.js`**

```javascript
// Use the 'card' fallback for this instance
const postsLoading = createLoading({ defaultFallback: 'card' });

function MyComponent() {
  return (
    <div>
      {/* But use the 'inline' fallback for this specific case */}
      <postsLoading.ShowWhenLoaded fallback="inline">
        <span>Post loaded!</span>
      </postsLoading.ShowWhenLoaded>
    </div>
  );
}
```

### Error Fallbacks and Retry Logic

When you use `wrap` or `wrapWithControl`,
the `retry` function is automatically implemented to re-run the original async operation.

```javascript
import { createLoading, registerDefaultErrorFallback } from 'react-easy-loading';

// A beautiful, reusable error component with a retry button
const ErrorCard = ({ errors, retry }) => (
  <div style={{ border: '1px solid red', padding: '1rem' }}>
    <h4>Oops! Something went wrong.</h4>
    <ul>
      {errors.map((e, i) => <li key={i}>{e.message || String(e)}</li>)}
    </ul>
    {retry && <button onClick={retry}>Try Again</button>}
  </div>
);

// Register it as the global default error fallback
registerDefaultErrorFallback(ErrorCard);

const dataLoading = createLoading();

function App() {
  const fetchData = () => {
    // This promise will reject
    return Promise.reject(new Error('Network connection failed'));
  };

  const load = () => dataLoading.wrap(fetchData);

  return (
    <div>
      <button onClick={load}>Load Data</button>
      <dataLoading.ShowWhenLoaded errorFallback>
        <p>Data loaded successfully!</p>
      </dataLoading.ShowWhenLoaded>
    </div>
  );
}
```

When `fetchData` fails, `ShowWhenLoaded` will automatically render the `ErrorCard` because `errorFallback` is set to `true`, which tells it to use the default. Clicking "Try Again" will call `dataLoading.retry()`, re-triggering the `fetchData` call.


---

## The `loading` Object: API Deep Dive

The object returned by `createLoading` is your command center.
It provides both **reactive hooks** for use in components and **non-reactive getters/setters** for use in event handlers or external logic.

### Reactive Hooks

Use these inside your React components to trigger re-renders when the state changes.

| Hook             | Description                                                       |
|------------------|-------------------------------------------------------------------|
| `use()`          | Returns the current `LoadingState` (`'idle'`, `'loading'`, etc.). |
| `useIsLoading()` | Returns `true` if the state is `'loading'`.                       |
| `useErrors()`    | Returns the array of errors, or `undefined`.                      |
| `useContext()`   | Returns the shared context object.                                |

### Getters (Non-Reactive)

Use these to get the current value without subscribing to updates.

| Getter        | Description                             |
|---------------|-----------------------------------------|
| `get()`       | Returns the current `LoadingState`.     |
| `getErrors()` | Returns the current array of errors.    |
| `isLoading()` | Returns `true` if state is `'loading'`. |
| `isSuccess()` | Returns `true` if state is `'success'`. |
| `isError()`   | Returns `true` if state is `'error'`.   |

### Setters and Methods

Use these to control the state from anywhere.

| Method              | Description                                         |
|---------------------|-----------------------------------------------------|
| `set(state)`        | Manually sets the loading state.                    |
| `reset()`           | Resets the state to its initial value.              |
| `retry()`           | Re-runs the last wrapped async function.            |
| `setRetry(fn)`      | Manually provides a custom retry function.          |
| `setErrors(errors)` | Overwrites the errors array.                        |
| `addError(error)`   | Adds an error to the errors array.                  |
| `destroy()`         | Destroys the loading instance and clears its state. |

---

## 🤝 Contributions

Contributions are welcome! Please follow the standard fork-and-pull-request workflow.

## Issues

If you encounter any issue, please open an issue [here](https://github.com/HichemTab-tech/react-easy-loading/issues).

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) file for more details.

&copy; 2025 [Hichem Taboukouyout](mailto:hichem.taboukouyout@hichemtab-tech.me)

---

_If you found this package helpful, consider leaving a star! ⭐️_
