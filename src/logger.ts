import pino from "pino";

const LOG = !!process.env.LOG || false;

export const logger = pino(pino.destination({
  enabled: LOG,
  level: process.env.PINO_LOG_LEVEL || "debug",
  sync: false,
  minLength: 4096,
}));
