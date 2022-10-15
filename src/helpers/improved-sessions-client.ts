import * as common from '@google-cloud/common';
import * as pumpify from 'pumpify';
import streamEvents from 'stream-events';
import { PassThrough } from 'stream';
import * as gax from 'google-gax';

import { SessionsClient as OldSessionsClient } from '@google-cloud/dialogflow-cx';

export class ImprovedSessionsClient {
  streamingIntentDetect(streamingConfig?: DialogFlowCX.IStreamingDetectIntentRequest, options?: gax.CallOptions) {
    options = options || {};
    streamingConfig = streamingConfig || {};

    // Format the audio content as input request for pipeline
    const recognizeStream = streamEvents(new pumpify.obj());

    const requestStream = (this as any)
      .streamingDetectIntent(options)
      .on('error', (err: Error) => {
        recognizeStream.destroy(err);
      })
      .on('response', response => {
        recognizeStream.emit('response', response);
      });

    // const copyConfig = streamingConfig;

    // Attach the events to the request stream, but only do so
    // when the first write (of data) comes in.
    //
    // This also means that the sending of the initial request (with the
    // config) is delayed until we get the first burst of data.
    recognizeStream.once('writing', () => {
      // The first message should contain the streaming config.
      requestStream.write(streamingConfig);

      // Set up appropriate piping between the stream returned by
      // the underlying API method and the one that we return.
      recognizeStream.setPipeline([
        // Format the user's input.
        // This entails that the user sends raw audio; it is wrapped in
        // the appropriate request structure.
        new PassThrough({
          objectMode: true,
          transform: (audioContent, _, next) => {
            if (audioContent !== undefined) {
              // copyConfig.queryInput.audio.audio = audioContent;
              // next(undefined, copyConfig);
              next(undefined, { queryInput: { audio: { audio: audioContent } } });
              return;
            }
            next();
          },
        }),
        requestStream,
        new PassThrough({
          objectMode: true,
          transform: (response, enc, next) => {
            if (response.error) {
              next(new common.util.ApiError(response.error));
              return;
            }
            next(undefined, response);
          },
        }),
      ]);
    });

    return recognizeStream;
  }
}

Object.defineProperty(
  OldSessionsClient.prototype,
  'streamingIntentDetect',
  Object.getOwnPropertyDescriptor(ImprovedSessionsClient.prototype, 'streamingIntentDetect')
);

const SessionsClient = OldSessionsClient;
type SessionsClient = OldSessionsClient;

export { SessionsClient };
export default { SessionsClient };
