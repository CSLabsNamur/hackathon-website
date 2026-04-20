type CopyWithToastOptions = NonNullable<Parameters<ReturnType<typeof useToast>["add"]>[0]>;

export function useCopyWithToast() {
  const {copy} = useClipboard();
  const toast = useToast();

  const copyWithToast = async (value: string, options: CopyWithToastOptions) => {
    await copy(value);
    toast.add({
      color: "success",
      ...options,
    });
  };

  return {
    copyWithToast,
  };
}
