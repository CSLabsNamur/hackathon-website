import NodeClam from "clamscan";

export const clamscan = new NodeClam().init({
  removeInfected: true,
  quarantineInfected: false,
  scanLog: "./clamscan.log",
  debugMode: false,
  scanRecursively: true,
  clamdscan: {
    socket: process.env.CLAMAV_HOST ? false : '/var/run/clamd.scan/clamd.sock',
    host: process.env.CLAMAV_HOST || false,
    port: process.env.CLAMAV_PORT ? parseInt(process.env.CLAMAV_PORT) : false,
    multiscan: true,
    active: true,
    tls: false,
  },
});
