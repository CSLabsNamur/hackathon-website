import NodeClam from "clamscan";

export const clamscan = new NodeClam().init({
  removeInfected: true,
  quarantineInfected: false,
  scanLog: "./clamscan.log",
  debugMode: false,
  scanRecursively: true,
  clamdscan: {
    socket: false, // Disable socket mode - use TCP instead
    host: process.env.CLAMAV_HOST || 'clamav', // Default to 'clamav' service name
    port: process.env.CLAMAV_PORT ? parseInt(process.env.CLAMAV_PORT) : 3310, // Default to 3310
    multiscan: true,
    active: true,
    tls: false,
  },
});
