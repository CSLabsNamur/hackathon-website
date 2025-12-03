interface UseAdminsParams {
  lazy?: boolean;
}

export const useAdmins = async (params?: UseAdminsParams) => {
  return useFetch("/api/admins", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};
