type HelpPopoverStatuses = Record<string, boolean>;

const HELP_POPOVERS_STORAGE_KEY = "help-popovers-status";

export function useHelpPopoverStatus(key: string) {
  const statuses = useLocalStorage<HelpPopoverStatuses>(HELP_POPOVERS_STORAGE_KEY, {});

  return computed<boolean>({
    get: () => statuses.value[key] === true,
    set: (value) => {
      statuses.value = {
        ...statuses.value,
        [key]: value,
      };
    },
  });
}

export function useHelpPopoverOpen(status: WritableComputedRef<boolean>) {
  return computed({
    get: () => !status.value,
    set: (open) => {
      if (!open) {
        status.value = true;
      }
    },
  });
}
