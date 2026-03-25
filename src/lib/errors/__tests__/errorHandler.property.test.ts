import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ApplicationError, ErrorHandler, COMMON_ERRORS } from '../errorHandler';

describe('Error Handling and User Feedback - Property Tests', () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler();
    });

    // Property 15: Error Handling Completeness
    it('should provide user-friendly error messages for all failure scenarios', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                (code, message) => {
                    const error = new ApplicationError(
                        code,
                        message,
                        'User-friendly message',
                        { severity: 'error', recoverable: true }
                    );

                    expect(error.code).toBe(code);
                    expect(error.message).toBe(message);
                    expect(error.userMessage).toBeTruthy();
                    expect(error.severity).toBe('error');
                    expect(error.recoverable).toBe(true);
                }
            )
        );
    });

    // Property: Error Logging
    it('should log detailed error information for debugging', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                (code, message) => {
                    const error = new ApplicationError(code, message, 'User message');
                    const errorInfo = errorHandler.logError(error);

                    expect(errorInfo.code).toBe(code);
                    expect(errorInfo.message).toBe(message);
                    expect(errorInfo.timestamp).toBeGreaterThan(0);
                    expect(errorInfo.severity).toBeDefined();
                }
            )
        );
    });

    // Property: Error Retrieval
    it('should retrieve errors by severity', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        code: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                        severity: fc.oneof(
                            fc.constant('info' as const),
                            fc.constant('warning' as const),
                            fc.constant('error' as const),
                            fc.constant('critical' as const)
                        ),
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (errorConfigs) => {
                    errorConfigs.forEach((config) => {
                        const error = new ApplicationError(
                            config.code,
                            'Test message',
                            'User message',
                            { severity: config.severity }
                        );
                        errorHandler.logError(error);
                    });

                    const allErrors = errorHandler.getErrors();
                    expect(allErrors.length).toBeGreaterThanOrEqual(errorConfigs.length);

                    // Test retrieval by severity
                    const bySeverity = errorHandler.getErrorsBySeverity('error');
                    expect(bySeverity.every((e) => e.severity === 'error')).toBe(true);
                }
            )
        );
    });

    // Property: Error Recovery Information
    it('should provide recovery steps for recoverable errors', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
                (steps) => {
                    const error = new ApplicationError(
                        'TEST_ERROR',
                        'Test message',
                        'User message',
                        {
                            recoverable: true,
                            recoverySteps: steps,
                        }
                    );

                    expect(error.recoverable).toBe(true);
                    expect(error.recoverySteps).toEqual(steps);
                    expect(error.recoverySteps?.length).toBe(steps.length);
                }
            )
        );
    });

    // Property: Error Subscription
    it('should notify subscribers of new errors', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        code: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                        message: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (errorConfigs) => {
                    let notificationCount = 0;
                    const unsubscribe = errorHandler.subscribe(() => {
                        notificationCount++;
                    });

                    errorConfigs.forEach((config) => {
                        const error = new ApplicationError(
                            config.code,
                            config.message,
                            'User message'
                        );
                        errorHandler.logError(error);
                    });

                    unsubscribe();

                    expect(notificationCount).toBe(errorConfigs.length);
                }
            )
        );
    });

    // Property: Common Error Definitions
    it('should provide valid common error definitions', () => {
        fc.assert(
            fc.property(fc.constant(null), () => {
                const networkError = COMMON_ERRORS.NETWORK_ERROR();
                expect(networkError.code).toBe('NETWORK_ERROR');
                expect(networkError.recoverable).toBe(true);
                expect(networkError.recoverySteps).toBeDefined();

                const validationError = COMMON_ERRORS.VALIDATION_ERROR('testField');
                expect(validationError.code).toBe('VALIDATION_ERROR');
                expect(validationError.severity).toBe('warning');

                const permissionError = COMMON_ERRORS.PERMISSION_ERROR();
                expect(permissionError.code).toBe('PERMISSION_ERROR');
                expect(permissionError.recoverable).toBe(false);

                const notFoundError = COMMON_ERRORS.NOT_FOUND_ERROR('resource');
                expect(notFoundError.code).toBe('NOT_FOUND_ERROR');
                expect(notFoundError.recoverable).toBe(true);

                const stateError = COMMON_ERRORS.STATE_CORRUPTION_ERROR();
                expect(stateError.code).toBe('STATE_CORRUPTION_ERROR');
                expect(stateError.severity).toBe('critical');
            })
        );
    });

    // Property: Error Context Preservation
    it('should preserve error context information', () => {
        fc.assert(
            fc.property(
                fc.record({
                    userId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    action: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                    timestamp: fc.integer({ min: 0 }),
                }),
                (context) => {
                    const error = new ApplicationError(
                        'TEST_ERROR',
                        'Test message',
                        'User message',
                        { context }
                    );

                    expect(error.context).toEqual(context);

                    const errorInfo = error.toErrorInfo();
                    expect(errorInfo.context).toEqual(context);
                }
            )
        );
    });
});
