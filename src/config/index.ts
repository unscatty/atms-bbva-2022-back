import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env;
export const {
  SOCKETS_PORT,
  DIALOGFLOWCX_AUDIO_ENCODING,
  DIALOGFLOWCX_AUDIO_SAMPLE_RATE,
  DIALOGFLOWCX_LANGUAGE_CODE,
  DIALOGFLOWCX_PROJECT_ID,
  DIALOGFLOWCX_AGENT_ID,
  DIALOGFLOWCX_REGION_ID,
} = process.env;
