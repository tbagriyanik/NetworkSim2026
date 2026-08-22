const CSRF_COOKIE_NAME = 'netsim-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function safeEqual(left: string, right: string): boolean {
    if (left.length !== right.length) return false;
    let result = 0;
    for (let index = 0; index < left.length; index += 1) {
        result |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return result === 0;
}

export function getCsrfTokenFromCookie(cookieHeader: string | null): string | null {
    const token = cookieHeader
        ?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${CSRF_COOKIE_NAME}=`))
        ?.slice(CSRF_COOKIE_NAME.length + 1);

    return token || null;
}

export function getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    return getCsrfTokenFromCookie(document.cookie);
}

export function csrfHeaders(): Record<string, string> {
    const token = getCsrfToken();
    return token ? { [CSRF_HEADER_NAME]: token } : {};
}

export function isValidCsrfRequest(cookieHeader: string | null, headerToken: string | null): boolean {
    const cookieToken = getCsrfTokenFromCookie(cookieHeader);
    return Boolean(cookieToken && headerToken && safeEqual(cookieToken, headerToken));
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };