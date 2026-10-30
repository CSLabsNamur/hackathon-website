import NodeClam from "clamscan";

export const clamscan = (async () => {
  const {clamav} = useRuntimeConfig();
  // During build or on dev machines, the ClamAV host might not exist.
  // We keep the promise API but avoid throwing unhandled rejections.
  try {
    return await new NodeClam().init({
      removeInfected: true,
      quarantineInfected: false,
      scanLog: "./clamscan.log",
      debugMode: false,
      scanRecursively: true,
      clamdscan: {
        socket: false, // Disable socket mode - use TCP instead
        host: clamav.host,
        port: clamav.port,
        multiscan: true,
        active: true,
        tls: false,
      },
    });
  } catch (e) {
    console.warn(`[clamscan] Initialization failed; virus scanning will be unavailable. If this shows as part of the build process, it's fine.\n\t${e}`);
  }
})();
