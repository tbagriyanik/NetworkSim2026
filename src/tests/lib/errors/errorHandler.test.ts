import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ApplicationError,
  ErrorHandler,
  errorHandler,
  formatErrorForUser,
  COMMON_ERRORS,
  CLI_ERRORS,
  DEVICE_ERRORS,
  STORAGE_ERRORS,
  DHCP_ERRORS,
  CLIPBOARD_ERRORS,
} from '@/lib/errors/errorHandler';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('ApplicationError', () => {
  it('should create error with all properties', () => {
    const error = new ApplicationError('TEST_ERR', 'Test message', 'User friendly message', {
      severity: 'warning',
      recoverable: true,
      recoverySteps: ['Step 1'],
      context: { key: 'value' },
    });

    expect(error.code).toBe('TEST_ERR');
    expect(error.message).toBe('Test message');
    expect(error.userMessage).toBe('User friendly message');
    expect(error.severity).toBe('warning');
    expect(error.recoverable).toBe(true);
    expect(error.recoverySteps).toEqual(['Step 1']);
    expect(error.context).toEqual({ key: 'value' });
    expect(error.name).toBe('ApplicationError');
  });

  it('should use defaults for optional fields', () => {
    const error = new ApplicationError('CODE', 'Msg', 'User msg');
    expect(error.severity).toBe('error');
    expect(error.recoverable).toBe(false);
    expect(error.recoverySteps).toBeUndefined();
  });

  it('should convert to ErrorInfo', () => {
    const error = new ApplicationError('CODE', 'Msg', 'User msg');
    const info = error.toErrorInfo();
    expect(info.code).toBe('CODE');
    expect(info.message).toBe('Msg');
    expect(info.userMessage).toBe('User msg');
    expect(info.timestamp).toBeGreaterThan(0);
  });
});

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = new ErrorHandler();
  });

  it('should log ApplicationError', () => {
    const error = new ApplicationError('TEST', 'Test', 'User test');
    const result = handler.logError(error);
    expect(result.code).toBe('TEST');
    expect(handler.getErrors()).toHaveLength(1);
  });

  it('should log regular Error', () => {
    const error = new Error('Something broke');
    const result = handler.logError(error);
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.userMessage).toContain('unexpected error');
  });

  it('should log error with context', () => {
    const error = new Error('Broke');
    const result = handler.logError(error, { deviceId: 'SW1' });
    expect(result.context).toEqual({ deviceId: 'SW1' });
  });

  it('should filter errors by code', () => {
    handler.logError(new ApplicationError('A', 'a', 'a'));
    handler.logError(new ApplicationError('B', 'b', 'b'));
    handler.logError(new ApplicationError('A', 'a2', 'a2'));
    const filtered = handler.getErrorsByCode('A');
    expect(filtered).toHaveLength(2);
  });

  it('should filter errors by severity', () => {
    handler.logError(new ApplicationError('A', 'a', 'a', { severity: 'warning' }));
    handler.logError(new ApplicationError('B', 'b', 'b', { severity: 'critical' }));
    const filtered = handler.getErrorsBySeverity('critical');
    expect(filtered).toHaveLength(1);
  });

  it('should clear errors', () => {
    handler.logError(new Error('test'));
    expect(handler.getErrors()).toHaveLength(1);
    handler.clearErrors();
    expect(handler.getErrors()).toHaveLength(0);
  });

  it('should limit max errors', () => {
    for (let i = 0; i < 150; i++) {
      handler.logError(new Error(`err-${i}`));
    }
    expect(handler.getErrors().length).toBeLessThanOrEqual(100);
  });

  it('should notify subscribers', () => {
    const listener = vi.fn();
    handler.subscribe(listener);
    handler.logError(new Error('test'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe listeners', () => {
    const listener = vi.fn();
    const unsubscribe = handler.subscribe(listener);
    unsubscribe();
    handler.logError(new Error('test'));
    expect(listener).not.toHaveBeenCalled();
  });

  it('should create recovery feedback', () => {
    const error = new ApplicationError('CODE', 'Msg', 'User msg', {
      recoverable: true,
      recoverySteps: ['Step 1', 'Step 2'],
    });
    const feedback = handler.toRecoveryFeedback(error.toErrorInfo());
    expect(feedback.title).toBe('CODE');
    expect(feedback.description).toBe('User msg');
    expect(feedback.recoveryHint).toContain('Step 1');
    expect(feedback.recoverable).toBe(true);
  });
});

describe('formatErrorForUser', () => {
  it('should extract info from ApplicationError', () => {
    const error = new ApplicationError('TEST', 'Msg', 'User msg');
    const result = formatErrorForUser(error);
    expect(result.code).toBe('TEST');
    expect(result.userMessage).toBe('User msg');
  });

  it('should use fallback for regular Error', () => {
    const error = new Error('Broke');
    const result = formatErrorForUser(error, 'Custom message');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.userMessage).toBe('Custom message');
  });

  it('should use default fallback for regular Error', () => {
    const error = new Error('Broke');
    const result = formatErrorForUser(error);
    expect(result.userMessage).toContain('unexpected error');
  });
});

describe('COMMON_ERRORS', () => {
  it('should create NETWORK_ERROR', () => {
    const error = COMMON_ERRORS.NETWORK_ERROR({ url: 'test' });
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.severity).toBe('error');
    expect(error.recoverable).toBe(true);
  });

  it('should create VALIDATION_ERROR', () => {
    const error = COMMON_ERRORS.VALIDATION_ERROR('ip_address');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.severity).toBe('warning');
  });

  it('should create PERMISSION_ERROR', () => {
    const error = COMMON_ERRORS.PERMISSION_ERROR();
    expect(error.code).toBe('PERMISSION_ERROR');
    expect(error.recoverable).toBe(false);
  });

  it('should create NOT_FOUND_ERROR', () => {
    const error = COMMON_ERRORS.NOT_FOUND_ERROR('device');
    expect(error.code).toBe('NOT_FOUND_ERROR');
    expect(error.context?.resource).toBe('device');
  });

  it('should create STATE_CORRUPTION_ERROR', () => {
    const error = COMMON_ERRORS.STATE_CORRUPTION_ERROR();
    expect(error.code).toBe('STATE_CORRUPTION_ERROR');
    expect(error.severity).toBe('critical');
  });
});

describe('CLI_ERRORS', () => {
  it('should create COMMAND_NOT_FOUND', () => {
    const error = CLI_ERRORS.COMMAND_NOT_FOUND('show vlann');
    expect(error.code).toBe('CLI_COMMAND_NOT_FOUND');
    expect(error.context?.command).toBe('show vlann');
  });

  it('should create INVALID_MODE', () => {
    const error = CLI_ERRORS.INVALID_MODE('ip routing', 'user');
    expect(error.code).toBe('CLI_INVALID_MODE');
  });

  it('should create INCOMPLETE_COMMAND', () => {
    const error = CLI_ERRORS.INCOMPLETE_COMMAND();
    expect(error.code).toBe('CLI_INCOMPLETE_COMMAND');
  });

  it('should create AUTHENTICATION_FAILED', () => {
    const error = CLI_ERRORS.AUTHENTICATION_FAILED();
    expect(error.code).toBe('CLI_AUTH_FAILED');
  });
});

describe('DEVICE_ERRORS', () => {
  it('should create DEVICE_OFFLINE', () => {
    const error = DEVICE_ERRORS.DEVICE_OFFLINE('SW1');
    expect(error.code).toBe('DEVICE_OFFLINE');
    expect(error.context?.deviceName).toBe('SW1');
  });

  it('should create DEVICE_NOT_FOUND', () => {
    const error = DEVICE_ERRORS.DEVICE_NOT_FOUND('SW-1');
    expect(error.code).toBe('DEVICE_NOT_FOUND');
  });

  it('should create PORT_UNAVAILABLE', () => {
    const error = DEVICE_ERRORS.PORT_UNAVAILABLE('fa0/1');
    expect(error.code).toBe('PORT_UNAVAILABLE');
  });

  it('should create CONNECTION_FAILED', () => {
    const error = DEVICE_ERRORS.CONNECTION_FAILED('PC1', 'SW1');
    expect(error.code).toBe('CONNECTION_FAILED');
  });
});

describe('STORAGE_ERRORS', () => {
  it('should create SAVE_FAILED', () => {
    const error = STORAGE_ERRORS.SAVE_FAILED();
    expect(error.code).toBe('STORAGE_SAVE_FAILED');
    expect(error.recoverable).toBe(true);
  });

  it('should create LOAD_FAILED', () => {
    const error = STORAGE_ERRORS.LOAD_FAILED();
    expect(error.code).toBe('STORAGE_LOAD_FAILED');
    expect(error.recoverable).toBe(false);
  });

  it('should create LOCAL_STORAGE_UNAVAILABLE', () => {
    const error = STORAGE_ERRORS.LOCAL_STORAGE_UNAVAILABLE();
    expect(error.code).toBe('STORAGE_UNAVAILABLE');
  });
});

describe('DHCP_ERRORS', () => {
  it('should create LEASE_FAILED', () => {
    const error = DHCP_ERRORS.LEASE_FAILED();
    expect(error.code).toBe('DHCP_LEASE_FAILED');
  });

  it('should create POOL_EXHAUSTED', () => {
    const error = DHCP_ERRORS.POOL_EXHAUSTED();
    expect(error.code).toBe('DHCP_POOL_EXHAUSTED');
  });
});

describe('CLIPBOARD_ERRORS', () => {
  it('should create COPY_FAILED', () => {
    const error = CLIPBOARD_ERRORS.COPY_FAILED();
    expect(error.code).toBe('CLIPBOARD_COPY_FAILED');
  });

  it('should create PASTE_FAILED', () => {
    const error = CLIPBOARD_ERRORS.PASTE_FAILED();
    expect(error.code).toBe('CLIPBOARD_PASTE_FAILED');
  });
});

describe('Singleton errorHandler', () => {
  it('should be an instance of ErrorHandler', () => {
    expect(errorHandler).toBeInstanceOf(ErrorHandler);
  });
});
