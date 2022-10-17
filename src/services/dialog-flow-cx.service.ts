import 'reflect-metadata';
import { Container, Inject, Service, Token } from 'typedi';
import { v4 } from 'uuid';
import { ImprovedSessionsClient, SessionsClient } from '../helpers/improved-sessions-client';

import {
  DIALOGFLOWCX_AGENT_ID,
  DIALOGFLOWCX_API_ENDPOINT,
  DIALOGFLOWCX_AUDIO_SAMPLE_RATE,
  DIALOGFLOWCX_LANGUAGE_CODE,
  DIALOGFLOWCX_PROJECT_ID,
  DIALOGFLOWCX_REGION_ID,
} from '@config';
import { google } from '@google-cloud/dialogflow-cx/build/protos/protos';
import { ReadStream } from 'fs';
import Pumpify from 'pumpify';
import { Transform } from 'stream';

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
  // pitch: 8.5,
  volumeGainDb: 0.5,
  voice: {
    ssmlGender: google.cloud.dialogflow.cx.v3.SsmlVoiceGender.SSML_VOICE_GENDER_FEMALE,
  },
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

  improvedDetectAudioStream(
    initialRequest: DialogFlowCX.IStreamingDetectIntentRequest,
    onData: (data: DialogFlowCX.IStreamingDetectIntentResponse) => void
  ): Pumpify {
    const initialStreamRequest: DialogFlowCX.IStreamingDetectIntentRequest = {
      ...initialRequest,
      session: this.sessionPath,
      queryInput: {
        audio: {
          config: {
            audioEncoding: 'AUDIO_ENCODING_LINEAR_16',
            sampleRateHertz: parseInt(DIALOGFLOWCX_AUDIO_SAMPLE_RATE),
            singleUtterance: true,
          },
        },
        languageCode: DIALOGFLOWCX_LANGUAGE_CODE,
      },
      outputAudioConfig: {
        audioEncoding: 'OUTPUT_AUDIO_ENCODING_LINEAR_16',
        synthesizeSpeechConfig: defaultSynthesizeSpeechConfig,
      },
    };

    const detectStream = (this.sessionClient as unknown as ImprovedSessionsClient)
      .streamingIntentDetect(initialStreamRequest)
      .on('error', console.error)
      .on('data', onData);

    return detectStream as Pumpify;
  }

  detectIntentAudioStream(stream: ReadStream): Pumpify {
    const detectStream = this.sessionClient
      .streamingDetectIntent()
      .on('error', console.error)
      .on('data', (data: DialogFlowCX.IStreamingDetectIntentResponse) => {
        if (data.recognitionResult) {
          console.log(`Intermediate Transcript: ${data.recognitionResult.transcript}`);
        } else {
          console.log('Detected Intent:');
          const result = data.detectIntentResponse.queryResult;

          console.log(`User Query: ${result.transcript}`);
          for (const message of result.responseMessages) {
            if (message.text) {
              console.log(`Agent Response: ${message.text.text}`);
            }
          }
          if (result.match.intent) {
            console.log(`Matched Intent: ${result.match.intent.displayName}`);
          }
          console.log(`Current Page: ${result.currentPage.displayName}`);

          if (data.recognitionResult.isFinal) {
            console.log('final stream');

            return this.detectIntentAudioStream(stream);
          }
        }
      });

    const initialStreamRequest: DialogFlowCX.IStreamingDetectIntentRequest = {
      session: this.sessionPath,
      queryInput: {
        audio: {
          config: {
            audioEncoding: 'AUDIO_ENCODING_LINEAR_16',
            sampleRateHertz: parseInt(DIALOGFLOWCX_AUDIO_SAMPLE_RATE),
            singleUtterance: false,
          },
        },
        languageCode: DIALOGFLOWCX_LANGUAGE_CODE,
      },
    };

    detectStream.write(initialStreamRequest);

    return new Pumpify(
      stream,
      // Format the audio stream into the request format.
      new Transform({
        objectMode: true,
        transform: (obj, _, next) => {
          next(null, { queryInput: { audio: { audio: obj } } });
        },
      }),
      detectStream
    );

    // return detectStream;
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
