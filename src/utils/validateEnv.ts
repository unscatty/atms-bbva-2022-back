import { cleanEnv, port, str, num } from 'envalid';

const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),

    SOCKETS_PORT: num(),

    DIALOGFLOWCX_AUDIO_ENCODING: str(),
    DIALOGFLOWCX_AUDIO_SAMPLE_RATE: num(),
    DIALOGFLOWCX_LANGUAGE_CODE: str({
      choices: ['en', 'es'],
    }),
    DIALOGFLOWCX_PROJECT_ID: str(),
    DIALOGFLOWCX_AGENT_ID: str(),
    DIALOGFLOWCX_REGION_ID: str(),

    DIALOGFLOWCX_API_ENDPOINT: str(),
  });
};

export default validateEnv;
