import 'reflect-metadata';
import { SessionsClient } from '@google-cloud/dialogflow-cx';
import { Service } from 'typedi';
import { v4 } from 'uuid';
import { Container, Token, Inject } from 'typedi';

import {
  DIALOGFLOWCX_AGENT_ID,
  DIALOGFLOWCX_AUDIO_SAMPLE_RATE,
  DIALOGFLOWCX_LANGUAGE_CODE,
  DIALOGFLOWCX_PROJECT_ID,
  DIALOGFLOWCX_REGION_ID,
  DIALOGFLOWCX_API_ENDPOINT,
} from '@config';

export type DialogFlowCXSessionPathOptions = {
  project: string;
  location: string;
  agent: string;
};

export const DEFAULT_DIALOG_FLOW_CX_SESSION_PATH_OPTIONS = new Token<DialogFlowCXSessionPathOptions>('DEFAULT_DIALOG_FLOW_CX_SESSION_PATH_OPTIONS');

export const defaultDialogFlowCXSessionPathOptions: DialogFlowCXSessionPathOptions = {
  project: DIALOGFLOWCX_PROJECT_ID,
  location: DIALOGFLOWCX_REGION_ID,
  agent: DIALOGFLOWCX_AGENT_ID,
};

export const DEFAULT_DIALOG_FLOW_CX_API_ENDPOINT = new Token<string>('DEFAULT_DIALOG_FLOW_CX_API_ENDPOINT');

export const defaultSynthesizeSpeechConfig: DialogFlowCX.ISynthesizeSpeechConfig = {
  speakingRate: 1.15,
  pitch: 10.0,
  volumeGainDb: 0.5,
};

// Add dependencies to IoC container
Container.set(DEFAULT_DIALOG_FLOW_CX_SESSION_PATH_OPTIONS, defaultDialogFlowCXSessionPathOptions);
Container.set(DEFAULT_DIALOG_FLOW_CX_API_ENDPOINT, DIALOGFLOWCX_API_ENDPOINT);

@Service()
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

  constructor(
    @Inject(DEFAULT_DIALOG_FLOW_CX_SESSION_PATH_OPTIONS)
    sessionPathOptions: DialogFlowCXSessionPathOptions,
    @Inject(DEFAULT_DIALOG_FLOW_CX_API_ENDPOINT)
    apiEndpoint: string
  ) {
    this.sessionClient = new SessionsClient({ apiEndpoint });
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
      // return this.sessionClient.detectIntent(request);

      return response;
    } catch (error) {
      console.error(error);
    }
  }

  async detectIntentAudioSynthesize(recordedAudio: Buffer) {
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
        outputAudioConfig: {
          audioEncoding: 'OUTPUT_AUDIO_ENCODING_LINEAR_16',
          synthesizeSpeechConfig: defaultSynthesizeSpeechConfig,
        },
      };

      const [response] = await this.sessionClient.detectIntent(request);
      // return this.sessionClient.detectIntent(request);

      return response;
    } catch (error) {
      console.error(error);
    }
  }

  async detectIntent(text: string) {
    const request: DialogFlowCX.IDetectIntentRequest = {
      session: this.sessionPath,
      queryInput: {
        text: {
          text,
        },
        languageCode: DIALOGFLOWCX_LANGUAGE_CODE,
      },
    };

    const [response] = await this.sessionClient.detectIntent(request);

    return response;
  }
}

export const defaultDialogFlowCXService = new DialogFlowCXService(defaultDialogFlowCXSessionPathOptions, DIALOGFLOWCX_API_ENDPOINT);
