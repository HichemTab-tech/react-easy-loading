import { describe, it, expect, vi } from 'vitest';
import { useCreateLocalLoading } from '../src';
import { renderHook } from '@testing-library/react';

describe('useCreateLocalLoading', () => {
    it('should create a loading instance', () => {
        const { result } = renderHook(() => useCreateLocalLoading());
        expect(result.current).toBeDefined();
        expect(result.current.get()).toBe('loading'); // Default is loading
    });

    it('should accept initialState as a string', () => {
        const { result } = renderHook(() => useCreateLocalLoading('idle'));
        expect(result.current.get()).toBe('idle');
    });

    it('should destroy the loading instance on unmount', () => {
        const { result, unmount } = renderHook(() => useCreateLocalLoading());
        const loading = result.current;
        
        const destroySpy = vi.spyOn(loading, 'destroy');
        
        unmount();
        
        expect(destroySpy).toHaveBeenCalled();
    });
});
