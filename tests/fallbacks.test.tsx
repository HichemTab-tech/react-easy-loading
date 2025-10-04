import { describe, it, expect } from 'vitest';
import {
    registerFallback,
    registerErrorFallback,
    registerDefaultFallback,
    registerDefaultErrorFallback,
    resolveLoadingFallback,
    resolveErrorFallback,
    getDefaultFallback,
    getDefaultErrorFallback
} from '../src/fallbacks';
import React from 'react';

describe('Fallbacks', () => {
    const TestFallback = () => <div>Test Fallback</div>;
    const TestErrorFallback = () => <div>Test Error Fallback</div>;
    const DefaultFallback = () => <div>Default Fallback</div>;
    const DefaultErrorFallback = () => <div>Default Error Fallback</div>;

    it('should register and resolve a named loading fallback', () => {
        registerFallback('test', <TestFallback />);
        const resolved = resolveLoadingFallback(undefined, 'test');
        expect(resolved).toEqual(<TestFallback />);
    });

    it('should register and resolve a named error fallback', () => {
        registerErrorFallback('testError', <TestErrorFallback />);
        const resolved = resolveErrorFallback(undefined, 'testError');
        expect(resolved).toEqual(<TestErrorFallback />);
    });

    it('should allow overriding the default loading fallback', () => {
        registerDefaultFallback(<DefaultFallback />);
        expect(getDefaultFallback()).toEqual(<DefaultFallback />);
        const resolved = resolveLoadingFallback();
        expect(resolved).toEqual(<DefaultFallback />);
    });

    it('should allow overriding the default error fallback', () => {
        registerDefaultErrorFallback(<DefaultErrorFallback />);
        expect(getDefaultErrorFallback()).toEqual(<DefaultErrorFallback />);
        const resolved = resolveErrorFallback();
        expect(resolved).toEqual(<DefaultErrorFallback />);
    });

    it('should prioritize prop fallback over default', () => {
        registerDefaultFallback(<DefaultFallback />);
        const resolved = resolveLoadingFallback(undefined, <TestFallback />);
        expect(resolved).toEqual(<TestFallback />);
    });

    it('should prioritize default fallback over global default', () => {
        registerDefaultFallback(<DefaultFallback />);
        const resolved = resolveLoadingFallback(<TestFallback />);
        expect(resolved).toEqual(<TestFallback />);
    });

    it('should return null if prop fallback is null', () => {
        const resolved = resolveLoadingFallback(undefined, null);
        expect(resolved).toBeNull();
    });
});
