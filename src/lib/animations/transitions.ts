export interface TransitionConfig {
    duration: number; // milliseconds
    easing: string; // CSS easing function
    delay?: number; // milliseconds
}

export const TRANSITION_PRESETS = {
    fast: {
        duration: 150,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    normal: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    slow: {
        duration: 500,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    bounce: {
        duration: 400,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    elastic: {
        duration: 600,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
};

export function getTransitionCSS(config: TransitionConfig): string {
    return `transition: all ${config.duration}ms ${config.easing}${config.delay ? ` ${config.delay}ms` : ''}`;
}

export function getAnimationDuration(
    normalDuration: number,
    reducedMotion: boolean
): number {
    return reducedMotion ? 0 : normalDuration;
}

export function getAnimationTiming(
    normalTiming: string,
    reducedMotion: boolean
): string {
    return reducedMotion ? 'none' : normalTiming;
}

export interface AnimationKeyframe {
    offset: number; // 0-1
    properties: Record<string, string | number>;
}

export function createKeyframeAnimation(
    name: string,
    keyframes: AnimationKeyframe[]
): string {
    const frames = keyframes
        .map(
            (kf) =>
                `${(kf.offset * 100).toFixed(1)}% { ${Object.entries(kf.properties)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('; ')}; }`
        )
        .join('\n');

    return `@keyframes ${name} { ${frames} }`;
}

export const COMMON_ANIMATIONS = {
    fadeIn: [
        { offset: 0, properties: { opacity: 0 } },
        { offset: 1, properties: { opacity: 1 } },
    ],
    fadeOut: [
        { offset: 0, properties: { opacity: 1 } },
        { offset: 1, properties: { opacity: 0 } },
    ],
    slideInUp: [
        { offset: 0, properties: { transform: 'translateY(10px)', opacity: 0 } },
        { offset: 1, properties: { transform: 'translateY(0)', opacity: 1 } },
    ],
    slideInDown: [
        { offset: 0, properties: { transform: 'translateY(-10px)', opacity: 0 } },
        { offset: 1, properties: { transform: 'translateY(0)', opacity: 1 } },
    ],
    slideInLeft: [
        { offset: 0, properties: { transform: 'translateX(-10px)', opacity: 0 } },
        { offset: 1, properties: { transform: 'translateX(0)', opacity: 1 } },
    ],
    slideInRight: [
        { offset: 0, properties: { transform: 'translateX(10px)', opacity: 0 } },
        { offset: 1, properties: { transform: 'translateX(0)', opacity: 1 } },
    ],
    scaleIn: [
        { offset: 0, properties: { transform: 'scale(0.95)', opacity: 0 } },
        { offset: 1, properties: { transform: 'scale(1)', opacity: 1 } },
    ],
    scaleOut: [
        { offset: 0, properties: { transform: 'scale(1)', opacity: 1 } },
        { offset: 1, properties: { transform: 'scale(0.95)', opacity: 0 } },
    ],
    pulse: [
        { offset: 0, properties: { opacity: 1 } },
        { offset: 0.5, properties: { opacity: 0.5 } },
        { offset: 1, properties: { opacity: 1 } },
    ],
    spin: [
        { offset: 0, properties: { transform: 'rotate(0deg)' } },
        { offset: 1, properties: { transform: 'rotate(360deg)' } },
    ],
};

export function useReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
}

export function getMotionPreference(): 'reduce' | 'no-preference' {
    if (typeof window === 'undefined') return 'no-preference';

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches ? 'reduce' : 'no-preference';
}
