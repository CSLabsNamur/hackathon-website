interface UseScheduleParams {
  lazy?: boolean;
}

export const useSchedule = async (params?: UseScheduleParams) => {
  return useFetch("/api/schedule", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};
