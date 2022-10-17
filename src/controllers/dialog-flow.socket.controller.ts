import DialogFlowCXService from '@services/dialog-flow-cx.service';
import { Blob } from 'buffer';
import pumpify from 'pumpify';
import { ConnectedSocket, OnConnect, SocketController } from 'socket-controllers';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
@Service()
@SocketController('/chat')
export default class DialogFlowCXSocketController {
  recognizeStream?: pumpify;

  constructor(private dfcxService: DialogFlowCXService) {}

  @OnConnect()
  onConnect(@ConnectedSocket() socket: Socket) {
    socket.emit('connected');

    // let this.recognizeStream: pumpify;
    // let

    socket.on('detect-intent', this.wrap(this.onDetectIntent).bind(this));
    socket.on('detect-intent-audio', this.wrap(this.onDetectIntentAudio).bind(this));
    socket.on('detect-intent-audio-synth', this.wrap(this.onDetectIntentAudioSynthesize).bind(this));
    socket.on('detect-intent-audio-echo', this.wrap(this.echoAudio).bind(this));

    socket.on('start-streaming-audio', (request: DialogFlowCX.IStreamingDetectIntentRequest) => this.listenStream(socket, request));

    socket.on('on-stream-data', (request: DialogFlowCX.IStreamingDetectIntentRequest) => {
      try {
        if (this.recognizeStream.destroyed) {
          this.listenStream(socket, request);
        }

        this.recognizeStream?.write(request);
        // }
      } catch (error) {}
    });

    socket.on('on-stream-stop', () => {
      this.recognizeStream?.destroy();
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

  listenStream(connectedSocket: Socket, request: DialogFlowCX.IStreamingDetectIntentRequest) {
    if (!this.recognizeStream?.destroyed) {
      this.recognizeStream?.destroy();
    }

    try {
      this.recognizeStream = this.dfcxService.improvedDetectAudioStream(request, data => {
        // socket.emit('intent-matched', data);

        if (data.recognitionResult) {
          console.log(`Intermediate Transcript: ${data.recognitionResult.transcript}`);
        } else {
          connectedSocket.emit('intent-matched', data);
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

            if (!this.recognizeStream?.destroyed) {
              this.recognizeStream?.destroy();
            }
          }
        }
      });

      console.log('on-start');

      // this.recognizeStream = createWriteStream('audio.wav')
    } catch (error) {
      console.error(error);
    }
  }

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
