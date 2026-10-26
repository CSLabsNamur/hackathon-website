interface RefreshOnPageReturnParams {
  minIntervalMs?: number;
}

export function useRefreshOnPageReturn(refresh: () => Promise<unknown> | unknown, options?: RefreshOnPageReturnParams) {
  const visibility = useDocumentVisibility();
  const focused = useWindowFocus();

  const throttledRefresh = useThrottleFn(refresh, options?.minIntervalMs ?? 1000, false);

  const refreshIfNeeded = () => {
    if (visibility.value !== "visible") return;

    return throttledRefresh();
  };

  watch([visibility, focused], ([nextVisibility, nextFocused], [previousVisibility, previousFocused]) => {
    const becameVisible = nextVisibility === "visible" && previousVisibility !== "visible";
    const gainedFocus = nextFocused && !previousFocused;

    if (becameVisible || gainedFocus) {
      void refreshIfNeeded();
    }
  });

  useEventListener("pageshow", () => {
    void refreshIfNeeded();
  });
}
