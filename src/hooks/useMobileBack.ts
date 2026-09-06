'use client';

import { useEffect, useRef } from 'react';

export function useMobileBack() {
  const hasPushedStateRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkForOpenOverlays = () => {
      // Check for common Radix UI / shadcn overlays and custom panels
      const overlays = document.querySelectorAll(
        '[role="dialog"][data-state="open"], [role="menu"], [data-state="open"][data-radix-popper-content-wrapper]'
      );

      let overlayOpen = overlays.length > 0;

      // Check for custom panels that might not have the attributes above
      if (!overlayOpen) {
        const panels = document.querySelectorAll('.fixed');
        for (let i = 0; i < panels.length; i++) {
          const panel = panels[i] as HTMLElement;
          if (panel.offsetParent === null) continue; // Quick check for hidden/unrendered elements
          if (panel.getAttribute('role') === 'dialog' || panel.getAttribute('aria-live')) continue;
          const classes = panel.className || '';
          if (
            (classes.includes('z-') || classes.includes('z-[')) &&
            panel.offsetHeight > 100 &&
            panel.tagName !== 'HEADER' &&
            panel.tagName !== 'NAV' &&
            panel.tagName !== 'FOOTER' &&
            !classes.includes('pointer-events-none')
          ) {
            overlayOpen = true;
            break;
          }
        }
      }

      if (overlayOpen && !hasPushedStateRef.current) {
        window.history.pushState({ overlayOpen: true }, '');
        hasPushedStateRef.current = true;
      } else if (!overlayOpen && hasPushedStateRef.current) {
        if (window.history.state?.overlayOpen) {
          window.history.back();
        }
        hasPushedStateRef.current = false;
      }
    };

    const scheduleCheck = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        checkForOpenOverlays();
      });
    };

    const observer = new MutationObserver(() => {
      scheduleCheck();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'class']
    });

    // Initial check
    scheduleCheck();

    const handlePopState = (_e: PopStateEvent) => {
      if (hasPushedStateRef.current) {
        hasPushedStateRef.current = false;

        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);

        const closeEvent = new CustomEvent('mobile-back-pressed');
        window.dispatchEvent(closeEvent);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      observer.disconnect();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
