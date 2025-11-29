interface UseScheduleParams {
  lazy?: boolean;
}

export const useSchedule = async (params?: UseScheduleParams) => {
  const {status, data, refresh} = useFetch("/api/schedule", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });

  return {data, status, refresh};
};
