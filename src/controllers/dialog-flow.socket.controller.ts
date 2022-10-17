import DialogFlowCXService from '@services/dialog-flow-cx.service';
import { Blob } from 'buffer';
import { ConnectedSocket, MessageBody, OnConnect, OnMessage, SocketController } from 'socket-controllers';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import type * as gax from 'google-gax';
import { createWriteStream, WriteStream } from 'fs';
import pumpify from 'pumpify';
@Service()
@SocketController('/chat')
export default class DialogFlowCXSocketController {
  // stream?: gax.CancellableStream;

  constructor(private dfcxService: DialogFlowCXService) {}

  @OnConnect()
  onConnect(@ConnectedSocket() socket: Socket) {
    socket.emit('connected');

    // let recognizeStream: pumpify;
    let recognizeStream: pumpify;

    socket.on('detect-intent', this.wrap(this.onDetectIntent).bind(this));
    socket.on('detect-intent-audio', this.wrap(this.onDetectIntentAudio).bind(this));
    socket.on('detect-intent-audio-synth', this.wrap(this.onDetectIntentAudioSynthesize).bind(this));
    socket.on('detect-intent-audio-echo', this.wrap(this.echoAudio).bind(this));

    const listenStream = (request: DialogFlowCX.IStreamingDetectIntentRequest) => {
      if (!recognizeStream?.destroyed) {
        recognizeStream?.destroy();
      }

      try {
        // this.dfcxService.detectIntentAudioStream(data).then(stream => {
        // recognizeStream = stream
        recognizeStream = this.dfcxService.improvedDetectAudioStream(request, data => {
          // socket.emit('intent-matched', data);

          if (data.recognitionResult) {
            console.log(`Intermediate Transcript: ${data.recognitionResult.transcript}`);

            // console.log(data);
            // const response = data.response;
            // console.log(response);

            // console.log('Detected Intent:');
            // const result = data.detectIntentResponse.queryResult;

            // console.log(`User Query: ${result.transcript}`);
            // for (const message of result.responseMessages) {
            //   if (message.text) {
            //     console.log(`Agent Response: ${message.text.text}`);
            //   }
            // }
            // if (result.match.intent) {
            //   console.log(`Matched Intent: ${result.match.intent.displayName}`);
            // }
            // console.log(`Current Page: ${result.currentPage.displayName}`);

            // if (data.recognitionResult.isFinal) {
            //   console.log('final stream');

            //   // return this.detectIntentAudioStream(stream);
            // }
          } else {
            socket.emit('intent-matched', data);
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

            // console.log(data.detectIntentResponse);

            if (data.detectIntentResponse.responseType === 'FINAL') {
              console.log('final stream');

              if (!recognizeStream?.destroyed) {
                recognizeStream?.destroy();
              }
            }
          }
        });

        console.log('on-start');

        // recognizeStream = createWriteStream('audio.wav')
      } catch (error) {
        console.error(error);
      }
    };

    socket.on('start-streaming-audio', listenStream);

    socket.on('on-stream-data', (request: DialogFlowCX.IStreamingDetectIntentRequest) => {
      try {
        if (recognizeStream.destroyed) {
          listenStream(request);
        }

        // console.log('on-data');
        // if (data.length > 0) {
        // console.log(data);
        // console.log('writing to stream');
        recognizeStream?.write(request);
        // }
      } catch (error) {}
    });

    socket.on('on-stream-stop', () => {
      recognizeStream.end();
      console.log('on-stop');
      // recognizeStream.close()
    });
  }

  // @OnMessage('start-streaming-audio')
  // startStreaming(@MessageBody() buffer: Buffer) {
  //   this.dfcxService.detectIntentAudioStream(buffer).then(stream => {
  //     this.stream = stream;
  //   });
  // }

  // @OnMessage('on-stream-data')
  // onStreamData(@MessageBody() data: Buffer) {
  //   this.stream?.write(data);
  // }

  private wrap<T>(func: (funcArgs: any) => T | Promise<T>) {
    return async (args: any, callback: (...args: any[]) => void) => {
      const response = await func.bind(this)(args);

      callback(response);
    };
  }

  async onDetectIntent(message: string) {
    return this.dfcxService.detectIntent(message);
  }

  async onDetectIntentAudio(audio: Buffer) {
    return this.dfcxService.detectIntentAudio(audio);
  }

  async onDetectIntentAudioSynthesize(audio: Buffer) {
    return this.dfcxService.detectIntentAudioSynthesize(audio);
  }

  async echoAudio(audio: Blob) {
    return audio;
  }
}
