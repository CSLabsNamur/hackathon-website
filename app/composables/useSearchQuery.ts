export const useSearchQuery = () => {
  const route = useRoute();
  const filter = ref("");

  watchOnce(() => route.query["search"], (value) => {
    filter.value = (Array.isArray(value) ? value[0] : value) ?? "";
  }, {
    immediate: true,
  });

  return filter;
};
