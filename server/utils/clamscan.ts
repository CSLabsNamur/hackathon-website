import NodeClam from "clamscan";

export const clamscan = (async () => {
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
        host: process.env.CLAMAV_HOST || "clamav", // Default to docker-compose service name
        port: process.env.CLAMAV_PORT ? parseInt(process.env.CLAMAV_PORT) : 3310, // Default to 3310
        multiscan: true,
        active: true,
        tls: false,
      },
    });
  } catch (e) {
    console.warn(`[clamscan] Initialization failed; virus scanning will be unavailable. If this shows as part of the build process, it's fine.\n\t${e}`);
  }
})();
