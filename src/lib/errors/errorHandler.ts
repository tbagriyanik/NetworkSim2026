export interface ErrorInfo {
    code: string;
    message: string;
    userMessage: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    recoverable: boolean;
    recoverySteps?: string[];
    timestamp: number;
    context?: Record<string, any>;
}

export interface RecoveryFeedback {
    title: string;
    description: string;
    recoveryHint?: string;
    severity: ErrorInfo['severity'];
    recoverable: boolean;
}

export class ApplicationError extends Error {
    code: string;
    userMessage: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    recoverable: boolean;
    recoverySteps?: string[];
    context?: Record<string, any>;

    constructor(
        code: string,
        message: string,
        userMessage: string,
        options?: {
            severity?: 'info' | 'warning' | 'error' | 'critical';
            recoverable?: boolean;
            recoverySteps?: string[];
            context?: Record<string, any>;
        }
    ) {
        super(message);
        this.code = code;
        this.userMessage = userMessage;
        this.severity = options?.severity ?? 'error';
        this.recoverable = options?.recoverable ?? false;
        this.recoverySteps = options?.recoverySteps;
        this.context = options?.context;
        this.name = 'ApplicationError';
    }

    toErrorInfo(): ErrorInfo {
        return {
            code: this.code,
            message: this.message,
            userMessage: this.userMessage,
            severity: this.severity,
            recoverable: this.recoverable,
            recoverySteps: this.recoverySteps,
            timestamp: Date.now(),
            context: this.context,
        };
    }
}

export class ErrorHandler {
    private errors: ErrorInfo[] = [];
    private maxErrors = 100;
    private listeners: Set<(error: ErrorInfo) => void> = new Set();

    logError(error: Error | ApplicationError, context?: Record<string, any>) {
        let errorInfo: ErrorInfo;

        if (error instanceof ApplicationError) {
            errorInfo = error.toErrorInfo();
            if (context) {
                errorInfo.context = { ...errorInfo.context, ...context };
            }
        } else {
            errorInfo = {
                code: 'UNKNOWN_ERROR',
                message: error.message,
                userMessage: 'An unexpected error occurred. Please try again.',
                severity: 'error',
                recoverable: false,
                timestamp: Date.now(),
                context,
            };
        }

        // Add to error log
        this.errors.push(errorInfo);
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error(`[${errorInfo.code}]`, errorInfo.message, errorInfo.context);
        }

        // Notify listeners
        this.notifyListeners(errorInfo);

        return errorInfo;
    }

    getErrors(): ErrorInfo[] {
        return [...this.errors];
    }

    getErrorsByCode(code: string): ErrorInfo[] {
        return this.errors.filter((e) => e.code === code);
    }

    getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
        return this.errors.filter((e) => e.severity === severity);
    }

    clearErrors() {
        this.errors = [];
    }

    subscribe(listener: (error: ErrorInfo) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    toRecoveryFeedback(errorInfo: ErrorInfo): RecoveryFeedback {
        const recoveryHint = errorInfo.recoverySteps?.length
            ? `Recovery steps: ${errorInfo.recoverySteps.join(' | ')}`
            : undefined;

        return {
            title: errorInfo.code,
            description: errorInfo.userMessage,
            recoveryHint,
            severity: errorInfo.severity,
            recoverable: errorInfo.recoverable,
        };
    }

    private notifyListeners(error: ErrorInfo) {
        this.listeners.forEach((listener) => listener(error));
    }
}

export const errorHandler = new ErrorHandler();

export function useErrorHandler() {
    return {
        logError: (error: Error | ApplicationError, context?: Record<string, any>) =>
            errorHandler.logError(error, context),
        getErrors: () => errorHandler.getErrors(),
        getErrorsByCode: (code: string) => errorHandler.getErrorsByCode(code),
        getErrorsBySeverity: (severity: ErrorInfo['severity']) =>
            errorHandler.getErrorsBySeverity(severity),
        clearErrors: () => errorHandler.clearErrors(),
        subscribe: (listener: (error: ErrorInfo) => void) =>
            errorHandler.subscribe(listener),
    };
}

export function formatErrorForUser(error: Error | ApplicationError, fallbackMessage?: string) {
    if (error instanceof ApplicationError) {
        return error.toErrorInfo();
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        userMessage: fallbackMessage ?? 'An unexpected error occurred. Please try again.',
        severity: 'error' as const,
        recoverable: false,
        timestamp: Date.now(),
        context: undefined,
    };
}

// Common error definitions
export const COMMON_ERRORS = {
    NETWORK_ERROR: (context?: Record<string, any>) =>
        new ApplicationError(
            'NETWORK_ERROR',
            'Network request failed',
            'Unable to connect to the server. Please check your internet connection.',
            {
                severity: 'error',
                recoverable: true,
                recoverySteps: ['Check your internet connection', 'Try again'],
                context,
            }
        ),

    VALIDATION_ERROR: (field: string, context?: Record<string, any>) =>
        new ApplicationError(
            'VALIDATION_ERROR',
            `Validation failed for field: ${field}`,
            `Invalid value for ${field}. Please check your input.`,
            {
                severity: 'warning',
                recoverable: true,
                context: { field, ...context },
            }
        ),

    PERMISSION_ERROR: (context?: Record<string, any>) =>
        new ApplicationError(
            'PERMISSION_ERROR',
            'Permission denied',
            'You do not have permission to perform this action.',
            {
                severity: 'error',
                recoverable: false,
                context,
            }
        ),

    NOT_FOUND_ERROR: (resource: string, context?: Record<string, any>) =>
        new ApplicationError(
            'NOT_FOUND_ERROR',
            `Resource not found: ${resource}`,
            `The requested ${resource} could not be found.`,
            {
                severity: 'warning',
                recoverable: true,
                context: { resource, ...context },
            }
        ),

    STATE_CORRUPTION_ERROR: (context?: Record<string, any>) =>
        new ApplicationError(
            'STATE_CORRUPTION_ERROR',
            'Application state is corrupted',
            'The application state appears to be corrupted. Attempting to recover...',
            {
                severity: 'critical',
                recoverable: true,
                recoverySteps: ['Reload the application', 'Clear browser cache', 'Contact support'],
                context,
            }
        ),
};
