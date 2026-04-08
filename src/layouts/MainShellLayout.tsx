import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppTopNav } from '@/components/AppTopNav';
import { cn } from '@/lib/utils';

/** Top inset for content & fixed sub-headers: safe area + nav row while nav visible; safe area only when nav is hidden (year bar rides up with the tab). */
export const APP_TOP_NAV_OFFSET_VAR = '--app-top-nav-offset';

const NAV_ROW_REM = '2.25rem';
const SHELL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export type MainShellOutletContext = {
  mainScrollRef: React.RefObject<HTMLElement | null>;
};

export function MainShellLayout() {
  const [shellNavVisible, setShellNavVisible] = useState(true);

  const shellStyle = {
    [APP_TOP_NAV_OFFSET_VAR]: shellNavVisible
      ? `calc(env(safe-area-inset-top) + ${NAV_ROW_REM})`
      : 'env(safe-area-inset-top)',
    fontFamily: 'var(--ios-font)',
  } as CSSProperties;

  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    setShellNavVisible(true);
    lastScrollTop.current = mainRef.current?.scrollTop ?? 0;
  }, [location.pathname]);

  const onMainScroll = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const y = el.scrollTop;
    const delta = y - lastScrollTop.current;
    if (y < 12) setShellNavVisible(true);
    else if (delta > 2) setShellNavVisible(false);
    else if (delta < -2) setShellNavVisible(true);
    lastScrollTop.current = y;
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const main = mainRef.current;
      const mainScrollable = main ? main.scrollHeight > main.clientHeight + 2 : false;
      if (mainScrollable) return;
      if (Math.abs(e.deltaY) < 4) return;
      if (e.deltaY > 0) setShellNavVisible(false);
      else setShellNavVisible(true);
    };
    document.addEventListener('wheel', onWheel, { passive: true, capture: true });
    return () => document.removeEventListener('wheel', onWheel, { capture: true });
  }, []);

  const isHome = location.pathname === '/';

  return (
    <div
      className={cn(
        'flex h-dvh max-h-dvh min-h-0 flex-col overflow-x-hidden',
        isHome ? 'bg-neutral-50' : 'bg-[var(--ios-bg)]'
      )}
      style={shellStyle}
    >
      <AppTopNav visible={shellNavVisible} />
      <main
        ref={mainRef}
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain"
        style={{
          paddingTop: `var(${APP_TOP_NAV_OFFSET_VAR})`,
          transition: `padding-top 0.3s ${SHELL_EASE}`,
        }}
        onScroll={onMainScroll}
      >
        <Outlet context={{ mainScrollRef: mainRef } as MainShellOutletContext} />
      </main>
    </div>
  );
}
