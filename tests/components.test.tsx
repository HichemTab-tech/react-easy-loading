import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createLoading } from '../src';
import { AllLoaded } from '../src';

describe('AllLoaded Component', () => {
    it('should render fallback when any loading is in progress', () => {
        const loading1 = createLoading({ initialState: 'loading' });
        const loading2 = createLoading({ initialState: 'success' });
        const { getByText } = render(
            <AllLoaded of={[loading1, loading2]} fallback={<div>Loading...</div>}>
                <div>Content</div>
            </AllLoaded>
        );
        expect(getByText('Loading...')).toBeDefined();
    });

    it('should render children when all loadings are successful', () => {
        const loading1 = createLoading({ initialState: 'success' });
        const loading2 = createLoading({ initialState: 'success' });
        const { getByText } = render(
            <AllLoaded of={[loading1, loading2]} fallback={<div>Loading...</div>}>
                <div>Content</div>
            </AllLoaded>
        );
        expect(getByText('Content')).toBeDefined();
    });

    it('should render error fallback if any loading has an error', () => {
        const loading1 = createLoading({ initialState: 'success' });
        const loading2 = createLoading<string[]>({ initialState: 'error' });
        loading2.setErrors(['Failed']);

        const errorFallback = vi.fn((errors, retry) => (
            <div>
                <span>Errors: {errors?.join(', ')}</span>
                <button onClick={retry}>Retry</button>
            </div>
        ));

        const { getByText } = render(
            <AllLoaded of={[loading1, loading2]} errorFallback={errorFallback}>
                <div>Content</div>
            </AllLoaded>
        );

        expect(getByText('Errors: Failed')).toBeDefined();
    });

    it('should aggregate errors from multiple sources', () => {
        const loading1 = createLoading<string[]>({ initialState: 'error' });
        loading1.setErrors(['Error 1']);
        const loading2 = createLoading<string[]>({ initialState: 'error' });
        loading2.setErrors(['Error 2']);

        const { getByText } = render(
            <AllLoaded 
                of={[loading1, loading2]} 
                errorFallback={(errors) => <span>{errors?.join(', ')}</span>}
            >
                <div>Content</div>
            </AllLoaded>
        );

        expect(getByText('Error 1, Error 2')).toBeDefined();
    });

    it('retry function should call retry on errored loadings', () => {
        const retry1 = vi.fn();
        const retry2 = vi.fn();
        const loading1 = createLoading({ initialState: 'error' });
        loading1.setRetry(retry1);
        const loading2 = createLoading({ initialState: 'success' });
        loading2.setRetry(retry2);

        let capturedRetry: (() => void) | undefined;
        render(
            <AllLoaded 
                of={[loading1, loading2]} 
                errorFallback={(_, retry) => {
                    capturedRetry = retry;
                    return <button onClick={retry}>Retry</button>
                }}
            >
                <div>Content</div>
            </AllLoaded>
        );
        
        capturedRetry?.();

        expect(retry1).toHaveBeenCalled();
        expect(retry2).not.toHaveBeenCalled(); // Should not retry successful ones
    });
});
