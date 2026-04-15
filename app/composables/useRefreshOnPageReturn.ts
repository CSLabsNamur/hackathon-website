interface RefreshOnPageReturnParams {
  minIntervalMs?: number;
}

export function useRefreshOnPageReturn(refresh: () => Promise<unknown> | unknown, options?: RefreshOnPageReturnParams) {
  const visibility = useDocumentVisibility();
  const focused = useWindowFocus();

  const minIntervalMs = options?.minIntervalMs ?? 1000;
  let lastRefreshAt = 0;

  const refreshIfNeeded = async () => {
    if (visibility.value !== "visible") return;

    const now = Date.now();
    if (now - lastRefreshAt < minIntervalMs) {
      return;
    }

    lastRefreshAt = now;
    await refresh();
  };

  watch([visibility, focused], ([nextVisibility, nextFocused], [previousVisibility, previousFocused]) => {
    const becameVisible = nextVisibility === "visible" && previousVisibility !== "visible";
    const gainedFocus = nextFocused && !previousFocused;

    if (becameVisible || gainedFocus) {
      void refreshIfNeeded();
    }
  });

  useEventListener(window, "pageshow", () => {
    void refreshIfNeeded();
  });
}
