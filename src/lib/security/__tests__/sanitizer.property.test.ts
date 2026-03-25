import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    sanitizeHTML,
    sanitizeInput,
    validateEmail,
    validateIPAddress,
    validateSubnetMask,
    validateMACAddress,
    validateURL,
    validateConfigData,
} from '../sanitizer';

describe('Security and Data Protection - Property Tests', () => {
    // Property 16: Security Input Validation
    it('should sanitize HTML to prevent XSS attacks', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 100 }),
                (input) => {
                    const sanitized = sanitizeHTML(input);

                    // Sanitized output should not contain unescaped HTML tags
                    expect(sanitized).not.toContain('<script');
                    expect(sanitized).not.toContain('</script>');

                    // Should be safe to use in innerHTML
                    const div = document.createElement('div');
                    div.innerHTML = sanitized;
                    expect(div.innerHTML).toBeTruthy();
                }
            )
        );
    });

    // Property: Input Sanitization
    it('should remove dangerous characters from input', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 100 }),
                (input) => {
                    const sanitized = sanitizeInput(input);

                    // Should not contain angle brackets
                    expect(sanitized).not.toContain('<');
                    expect(sanitized).not.toContain('>');

                    // Should be trimmed
                    expect(sanitized).toBe(sanitized.trim());
                }
            )
        );
    });

    // Property: Email Validation
    it('should correctly validate email addresses', () => {
        fc.assert(
            fc.property(
                fc.emailAddress(),
                (email) => {
                    const result = validateEmail(email);
                    expect(typeof result).toBe('boolean');

                    // Valid emails should pass
                    if (email.includes('@') && email.includes('.')) {
                        expect(result).toBe(true);
                    }
                }
            )
        );
    });

    // Property: IP Address Validation
    it('should correctly validate IP addresses', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.integer({ min: 0, max: 255 }),
                    fc.integer({ min: 0, max: 255 }),
                    fc.integer({ min: 0, max: 255 }),
                    fc.integer({ min: 0, max: 255 })
                ),
                ([a, b, c, d]) => {
                    const validIP = `${a}.${b}.${c}.${d}`;
                    expect(validateIPAddress(validIP)).toBe(true);

                    // Invalid IPs should fail
                    expect(validateIPAddress('256.256.256.256')).toBe(false);
                    expect(validateIPAddress('invalid')).toBe(false);
                    expect(validateIPAddress('192.168.1')).toBe(false);
                }
            )
        );
    });

    // Property: Subnet Mask Validation
    it('should correctly validate subnet masks', () => {
        fc.assert(
            fc.property(
                fc.constant(null),
                () => {
                    // Valid subnet masks
                    expect(validateSubnetMask('255.255.255.0')).toBe(true);
                    expect(validateSubnetMask('255.255.0.0')).toBe(true);
                    expect(validateSubnetMask('255.0.0.0')).toBe(true);

                    // Invalid subnet masks
                    expect(validateSubnetMask('255.255.255.255')).toBe(true); // /32 is valid
                    expect(validateSubnetMask('255.255.0.255')).toBe(false); // Invalid pattern
                    expect(validateSubnetMask('192.168.1.1')).toBe(false); // Not a subnet mask
                }
            )
        );
    });

    // Property: MAC Address Validation
    it('should correctly validate MAC addresses', () => {
        fc.assert(
            fc.property(
                fc.constant(null),
                () => {
                    // Valid MAC addresses
                    expect(validateMACAddress('00:1A:2B:3C:4D:5E')).toBe(true);
                    expect(validateMACAddress('00-1A-2B-3C-4D-5E')).toBe(true);
                    expect(validateMACAddress('001a.2b3c.4d5e')).toBe(true);

                    // Invalid MAC addresses
                    expect(validateMACAddress('00:1A:2B:3C:4D')).toBe(false);
                    expect(validateMACAddress('invalid')).toBe(false);
                }
            )
        );
    });

    // Property: URL Validation
    it('should correctly validate URLs', () => {
        fc.assert(
            fc.property(
                fc.webUrl(),
                (url) => {
                    const result = validateURL(url);
                    expect(typeof result).toBe('boolean');

                    // Valid URLs should pass
                    if (url.startsWith('http')) {
                        expect(result).toBe(true);
                    }
                }
            )
        );
    });

    // Property: Configuration Data Validation
    it('should validate configuration data correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1 }),
                    ip: fc.option(fc.ipV4()),
                    subnet: fc.option(fc.ipV4()),
                    gateway: fc.option(fc.ipV4()),
                    dns: fc.option(fc.ipV4()),
                }),
                (config) => {
                    const result = validateConfigData(config);

                    expect(result).toHaveProperty('valid');
                    expect(result).toHaveProperty('errors');
                    expect(Array.isArray(result.errors)).toBe(true);

                    // Valid configs should have no errors
                    if (result.valid) {
                        expect(result.errors.length).toBe(0);
                    }

                    // Invalid configs should have errors
                    if (!result.valid) {
                        expect(result.errors.length).toBeGreaterThan(0);
                    }
                }
            )
        );
    });

    // Property: Data Integrity
    it('should maintain data integrity during sanitization', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 100 }),
                (input) => {
                    const sanitized = sanitizeInput(input);

                    // Sanitized version should be shorter or equal
                    expect(sanitized.length).toBeLessThanOrEqual(input.length);

                    // Should not contain dangerous characters
                    expect(sanitized).not.toContain('<');
                    expect(sanitized).not.toContain('>');
                }
            )
        );
    });
});
