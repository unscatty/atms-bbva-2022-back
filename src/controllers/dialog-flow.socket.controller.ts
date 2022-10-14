import DialogFlowCXService from '@services/dialog-flow-cx.service';
import { Blob } from 'buffer';
import { ConnectedSocket, OnConnect, SocketController } from 'socket-controllers';
import { Socket } from 'socket.io';
import { Service } from 'typedi';

@Service()
@SocketController('/chat')
export default class DialogFlowCXSocketController {
  constructor(private dfcxService: DialogFlowCXService) {}

  @OnConnect()
  onConnect(@ConnectedSocket() socket: Socket) {
    socket.emit('connected');

    socket.on('detect-intent', this.wrap(this.onDetectIntent).bind(this));
    socket.on('detect-intent-audio', this.wrap(this.onDetectIntentAudio).bind(this));
    socket.on('detect-intent-audio-synth', this.wrap(this.onDetectIntentAudioSynthesize).bind(this));
    socket.on('detect-intent-audio-echo', this.wrap(this.echoAudio).bind(this));
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
