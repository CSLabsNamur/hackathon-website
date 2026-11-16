export async function useEventPhase() {
  const dayjs = useDayjs();
  const now = useNow({scheduler: callback => useIntervalFn(callback, 60000)});
  const {data: settings, refresh} = await useSettings({lazy: true});

  const eventPhase = computed<EventPhase>(() => {
    if (dayjs(now.value).isAfter(settings.value?.event.endDate)) return EventPhase.ENDED;
    if (dayjs(now.value).isSameOrAfter(settings.value?.event.startDate)) return EventPhase.ONGOING;
    return EventPhase.PREPARATION;
  });

  return {data: eventPhase, refresh};
}
