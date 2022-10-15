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

    socket.on('start-streaming-audio', () => {
      try {
        // this.dfcxService.detectIntentAudioStream(data).then(stream => {
        // recognizeStream = stream;
        recognizeStream = this.dfcxService.improvedDetectAudioStream(data => {
          socket.emit('intent-matched', data);
        });
        console.log('on-start');

        // recognizeStream = createWriteStream('audio.wav')
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('on-stream-data', (data: Buffer) => {
      try {
        // console.log('on-data');
        if (data.length > 0) {
          // console.log(data);
          // console.log('writing to stream');
          recognizeStream?.write(data);
        }
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
