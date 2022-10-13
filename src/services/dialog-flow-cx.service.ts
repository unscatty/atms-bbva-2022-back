import { SessionsClient } from '@google-cloud/dialogflow-cx';
import { v4 } from 'uuid';

import {
  DIALOGFLOWCX_AUDIO_SAMPLE_RATE,
  DIALOGFLOWCX_LANGUAGE_CODE,
  DIALOGFLOWCX_PROJECT_ID,
  DIALOGFLOWCX_REGION_ID,
  DIALOGFLOWCX_AGENT_ID,
} from '@config';

export type DialogFlowCXSessionPathOptions = {
  project: string;
  location: string;
  agent: string;
};

export default class DialogFlowCXService {
  sessionClient: SessionsClient;
  sessionPathOptions: DialogFlowCXSessionPathOptions;
  sessionPath: ReturnType<InstanceType<typeof SessionsClient>['projectLocationAgentSessionPath']>;

  resetSession() {
    this.sessionPath = this.sessionClient.projectLocationAgentSessionPath(
      this.sessionPathOptions.project,
      this.sessionPathOptions.location,
      this.sessionPathOptions.agent,
      v4()
    );
  }

  constructor(sessionPathOptions: DialogFlowCXSessionPathOptions) {
    this.sessionClient = new SessionsClient();
    this.sessionPathOptions = sessionPathOptions;

    this.sessionPath = this.sessionClient.projectLocationAgentSessionPath(
      this.sessionPathOptions.project,
      this.sessionPathOptions.location,
      this.sessionPathOptions.agent,
      v4()
    );
  }

  async detectIntentAudio(recordedAudio: Buffer) {
    try {
      const request: DialogFlowCX.IDetectIntentRequest = {
        session: this.sessionPath,
        queryInput: {
          // TODO: set this as a separate config object
          audio: {
            config: {
              audioEncoding: 'AUDIO_ENCODING_LINEAR_16',
              sampleRateHertz: parseInt(DIALOGFLOWCX_AUDIO_SAMPLE_RATE),
            },
            audio: recordedAudio,
          },
          languageCode: DIALOGFLOWCX_LANGUAGE_CODE,
        },
      };

      const [response] = await this.sessionClient.detectIntent(request);

      return response;
    } catch (error) {
      console.error(error);
    }
  }
}

export const defaultDialogFlowCXSessioPathOptions: DialogFlowCXSessionPathOptions = {
  project: DIALOGFLOWCX_PROJECT_ID,
  location: DIALOGFLOWCX_REGION_ID,
  agent: DIALOGFLOWCX_AGENT_ID,
};

export const defaultDialogFlowCXService = new DialogFlowCXService(defaultDialogFlowCXSessioPathOptions);
