import { describe, it, expect, vi } from 'vitest';
import { createLoading } from '../src';
import { act, render, renderHook } from '@testing-library/react';
import React from 'react';

describe('createLoading', () => {
    it('should initialize with the correct initial state', () => {
        const loading = createLoading({ initialState: 'idle' });
        expect(loading.get()).toBe('idle');
    });

    it('should initialize with "loading" by default', () => {
        const loading = createLoading();
        expect(loading.get()).toBe('loading');
    });

    it('should allow setting the state', () => {
        const loading = createLoading();
        loading.set('success');
        expect(loading.get()).toBe('success');
    });

    it('should reset the state to the initial state', () => {
        const loading = createLoading({ initialState: 'idle' });
        loading.set('success');
        loading.reset();
        expect(loading.get()).toBe('idle');
    });

    it('should correctly report boolean states', () => {
        const loading = createLoading(); // initial is 'loading'
        expect(loading.isLoading()).toBe(true);
        expect(loading.isIdle()).toBe(false);
        expect(loading.isSuccess()).toBe(false);
        expect(loading.isError()).toBe(false);
        expect(loading.isFinished()).toBe(false);

        loading.set('success');
        expect(loading.isLoading()).toBe(false);
        expect(loading.isSuccess()).toBe(true);
        expect(loading.isFinished()).toBe(true);

        loading.set('error');
        expect(loading.isError()).toBe(true);
        expect(loading.isFinished()).toBe(true);

        loading.set('idle');
        expect(loading.isIdle()).toBe(true);
    });

    it('should handle multiple states for is()', () => {
        const loading = createLoading();
        loading.set('success');
        expect(loading.is(['success', 'error'])).toBe(true);
        loading.set('loading');
        expect(loading.is(['success', 'error'])).toBe(false);
    });

    it('should handle errors', () => {
        const loading = createLoading<string[]>();
        expect(loading.hasErrors()).toBe(false);
        loading.addError('An error occurred');
        expect(loading.hasErrors()).toBe(true);
        expect(loading.getErrors()).toEqual(['An error occurred']);
        loading.clearErrors();
        expect(loading.hasErrors()).toBe(false);
        loading.setErrors(['e1', 'e2']);
        expect(loading.getErrors()).toEqual(['e1', 'e2']);
    });

    it('should handle context', () => {
        const loading = createLoading<string[], { id: number }>();
        loading.setContext({ id: 123 });
        expect(loading.getContext()).toEqual({ id: 123 });
    });

    it('should call retry function', () => {
        const retryFn = vi.fn();
        const loading = createLoading({ defaultRetry: retryFn });
        loading.retry();
        expect(retryFn).toHaveBeenCalledTimes(1);
    });

    it('should allow setting a new retry function', () => {
        const initialRetry = vi.fn();
        const newRetry = vi.fn();
        const loading = createLoading({ defaultRetry: initialRetry });
        loading.setRetry(newRetry);
        loading.retry();
        expect(initialRetry).not.toHaveBeenCalled();
        expect(newRetry).toHaveBeenCalledTimes(1);
    });

    it('should update react hooks on state change', () => {
        const loading = createLoading();
        const { result } = renderHook(() => loading.use());
        expect(result.current).toBe('loading');
        act(() => {
            loading.set('success');
        });
        expect(result.current).toBe('success');
    });

    describe('promise wrapping', () => {
        it('wrap should transition through loading -> success', async () => {
            const loading = createLoading({ initialState: 'idle' });
            const promiseFn = () => new Promise(resolve => setTimeout(() => resolve('done'), 10));
            
            const wrappedPromise = loading.wrap(promiseFn);
            expect(loading.isLoading()).toBe(true);

            await act(async () => {
                await wrappedPromise;
            });

            expect(loading.isSuccess()).toBe(true);
        });

        it('wrap should transition through loading -> error on rejection', async () => {
            const loading = createLoading<string[]>({ initialState: 'idle' });
            const error = new Error('Failed');
            const promiseFn = () => new Promise((_, reject) => setTimeout(() => reject(error), 10));

            const wrappedPromise = loading.wrap(promiseFn);
            expect(loading.isLoading()).toBe(true);

            await act(async () => {
                await wrappedPromise.catch(() => {});
            });

            expect(loading.isError()).toBe(true);
            expect(loading.getErrors()).toEqual([error]);
        });

        it('wrapWithControl should not start automatically', () => {
            const loading = createLoading({ initialState: 'idle' });
            const promiseFn = vi.fn(() => new Promise(resolve => resolve('done')));
            
            loading.wrapWithControl(promiseFn);

            expect(loading.isIdle()).toBe(true);
            expect(promiseFn).not.toHaveBeenCalled();
        });

        it('wrapWithControl start() should trigger the promise and state changes', async () => {
            const loading = createLoading({ initialState: 'idle' });
            const promiseFn = () => new Promise(resolve => setTimeout(() => resolve('done'), 10));
            
            const controlled = loading.wrapWithControl(promiseFn);
            
            const startPromise = controlled.start();
            expect(loading.isLoading()).toBe(true);

            await act(async () => {
                await startPromise;
            });

            expect(loading.isSuccess()).toBe(true);
        });
    });

    describe('waiting functions', () => {
        it('whenLoaded resolves when state is success', async () => {
            const loading = createLoading();
            setTimeout(() => loading.set('success'), 10);
            await expect(loading.whenLoaded()).resolves.toBeUndefined();
        });

        it('whenFinished resolves when state is success', async () => {
            const loading = createLoading();
            setTimeout(() => loading.set('success'), 10);
            await expect(loading.whenFinished()).resolves.toBeUndefined();
        });

        it('whenFinished resolves when state is error', async () => {
            const loading = createLoading();
            setTimeout(() => loading.set('error'), 10);
            await expect(loading.whenFinished()).resolves.toBeUndefined();
        });
    });

    describe('Components', () => {
        it('ShowWhen should render children when state matches', () => {
            const loading = createLoading();
            const { queryByText } = render(
                <loading.ShowWhen state="loading">
                    <span>Visible</span>
                </loading.ShowWhen>
            );
            expect(queryByText('Visible')).not.toBeNull();
        });

        it('ShowWhen should not render children when state does not match', () => {
            const loading = createLoading();
            const { queryByText } = render(
                <loading.ShowWhen state="success">
                    <span>Hidden</span>
                </loading.ShowWhen>
            );
            expect(queryByText('Hidden')).toBeNull();
        });

        it('ShowWhenLoaded should render children on success', () => {
            const loading = createLoading({initialState: 'success'});
            const { getByText } = render(
                <loading.ShowWhenLoaded>
                    <span>Content</span>
                </loading.ShowWhenLoaded>
            );
            expect(getByText('Content')).toBeDefined();
        });

        it('ShowWhileLoading should render children on loading', () => {
            const loading = createLoading({initialState: 'loading'});
            const { getByText } = render(
                <loading.ShowWhileLoading>
                    <span>Loading...</span>
                </loading.ShowWhileLoading>
            );
            expect(getByText('Loading...')).toBeDefined();
        });

        it('ShowWhenError should render children on error', () => {
            const loading = createLoading<string[]>({initialState: 'error'});
            loading.setErrors(['failed']);
            const { getByText } = render(
                <loading.ShowWhenError>
                    {(errors) => <span>Error: {errors?.[0]}</span>}
                </loading.ShowWhenError>
            );
            expect(getByText('Error: failed')).toBeDefined();
        });
    });
});
