/**
 * API Client with Error Handling
 * Provides centralized API request handling with retry logic and error management
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    timestamp: number;
}

export interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

export class ApiError extends Error {
    constructor(
        public code: string,
        public status: number,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

class ApiClient {
    private baseUrl = '';
    private defaultTimeout = 30000; // 30 seconds
    private defaultRetries = 3;
    private defaultRetryDelay = 1000; // 1 second

    /**
     * Make API request with error handling and retry logic
     */
    async request<T = any>(
        endpoint: string,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const {
            method = 'GET',
            headers = {},
            body,
            timeout = this.defaultTimeout,
            retries = this.defaultRetries,
            retryDelay = this.defaultRetryDelay,
        } = options;

        const url = `${this.baseUrl}${endpoint}`;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers,
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await this.parseErrorResponse(response);
                    throw new ApiError(
                        errorData.code || `HTTP_${response.status}`,
                        response.status,
                        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                        errorData
                    );
                }

                const data = await response.json();
                return {
                    success: true,
                    data,
                    timestamp: Date.now(),
                };
            } catch (error) {
                // Don't retry on client errors (4xx)
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Retry on server errors (5xx) or network errors
                if (attempt < retries) {
                    await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
                    continue;
                }

                // All retries exhausted
                if (error instanceof ApiError) {
                    throw error;
                }

                if (error instanceof TypeError && error.message === 'Failed to fetch') {
                    throw new ApiError(
                        'NETWORK_ERROR',
                        0,
                        'Network error. Please check your connection.',
                        { originalError: error }
                    );
                }

                if (error instanceof DOMException && error.name === 'AbortError') {
                    throw new ApiError(
                        'REQUEST_TIMEOUT',
                        0,
                        `Request timeout after ${timeout}ms`,
                        { timeout }
                    );
                }

                throw new ApiError(
                    'UNKNOWN_ERROR',
                    0,
                    'An unexpected error occurred',
                    { originalError: error }
                );
            }
        }

        throw new ApiError('MAX_RETRIES_EXCEEDED', 0, 'Maximum retries exceeded');
    }

    /**
     * GET request
     */
    async get<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T = any>(
        endpoint: string,
        body?: any,
        options?: Omit<ApiRequestOptions, 'method' | 'body'>
    ) {
        return this.request<T>(endpoint, { ...options, method: 'POST', body });
    }

    /**
     * PUT request
     */
    async put<T = any>(
        endpoint: string,
        body?: any,
        options?: Omit<ApiRequestOptions, 'method' | 'body'>
    ) {
        return this.request<T>(endpoint, { ...options, method: 'PUT', body });
    }

    /**
     * DELETE request
     */
    async delete<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * PATCH request
     */
    async patch<T = any>(
        endpoint: string,
        body?: any,
        options?: Omit<ApiRequestOptions, 'method' | 'body'>
    ) {
        return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
    }

    /**
     * Private methods
     */

    private async parseErrorResponse(response: Response) {
        try {
            const data = await response.json();
            return {
                code: data.code || `HTTP_${response.status}`,
                message: data.message || data.error || response.statusText,
                details: data,
            };
        } catch {
            return {
                code: `HTTP_${response.status}`,
                message: response.statusText,
            };
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set base URL for API requests
     */
    setBaseUrl(url: string) {
        this.baseUrl = url;
    }

    /**
     * Set default timeout
     */
    setDefaultTimeout(ms: number) {
        this.defaultTimeout = ms;
    }

    /**
     * Set default retries
     */
    setDefaultRetries(count: number) {
        this.defaultRetries = count;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for use in components
export function useApiClient() {
    return apiClient;
}
