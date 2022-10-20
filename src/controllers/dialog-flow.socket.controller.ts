import DialogFlowCXService from '@services/dialog-flow-cx.service';
import { Blob } from 'buffer';
import pumpify from 'pumpify';
import { ConnectedSocket, MessageBody, OnConnect, OnMessage, SocketController, SocketId } from 'socket-controllers';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
@Service()
@SocketController('/chat')
export default class DialogFlowCXSocketController {
  // recognizeStream?: pumpify;
  recognizeStreams: Record<string, pumpify>;

  constructor(private dfcxService: DialogFlowCXService) {
    this.recognizeStreams = {};
  }

  @OnConnect()
  onConnect(@ConnectedSocket() socket: Socket) {
    socket.emit('connected');

    // Request-response like events
    socket.on('detect-intent', this.wrap(this.onDetectIntent).bind(this));
    socket.on('detect-intent-text', this.wrap(this.onDetectIntentText).bind(this));
    socket.on('detect-intent-audio', this.wrap(this.onDetectIntentAudio).bind(this));
    socket.on('detect-intent-audio-synth', this.wrap(this.onDetectIntentAudioSynthesize).bind(this));
    socket.on('detect-intent-audio-echo', this.wrap(this.echoAudio).bind(this));
  }

  @OnMessage('start-streaming-audio')
  onStartStreamingAudio(@MessageBody() initialRequest: DialogFlowCX.IStreamingDetectIntentRequest, @ConnectedSocket() socket: Socket) {
    try {
      this.listenStream(socket, initialRequest);
    } catch (error) {
      console.debug(error);
    }
  }

  @OnMessage('stream-audio-data')
  onStreamAudioData(@MessageBody() request: DialogFlowCX.IStreamingDetectIntentRequest, @ConnectedSocket() socket: Socket) {
    try {
      if (this.recognizeStreams[socket.id]?.destroyed) {
        // Restart the stream
        this.listenStream(socket, request);
      }

      this.recognizeStreams[socket.id]?.write(request);
    } catch (error) {
      console.error(error);
      this.destroyStream(socket.id);
      // Restart the stream
      this.listenStream(socket, request);
    }
  }

  @OnMessage('stop-streaming-audio')
  onStopStreamingAudio(@SocketId() socketID: string) {
    console.log('on-stop-audio');
    this.destroyStream(socketID);
    delete this.recognizeStreams[socketID];
  }

  @OnMessage('pause-streaming-audio')
  onPauseStreamingAudio(@SocketId() socketID: string) {
    console.log('on-pause-streaming-audio');

    this.pauseStream(socketID);
  }

  @OnMessage('resume-streaming-audio')
  onResumeStreamingAudio(@SocketId() socketID: string) {
    console.log('on-resume-streaming-audio');

    this.resumeStream(socketID);
  }

  @OnMessage('reset-conversation')
  onResetConversation() {
    this.dfcxService.resetSession();
  }

  private pauseStream(socketID: string) {
    const stream = this.recognizeStreams[socketID];

    if (!stream?.destroyed || !stream?.isPaused) {
      this.recognizeStreams[socketID]?.pause();
    }
  }

  private resumeStream(socketID: string) {
    const stream = this.recognizeStreams[socketID];

    if (!stream?.destroyed && stream?.isPaused) {
      stream.resume();
    }
  }

  private destroyStream(socketID: string) {
    if (!this.recognizeStreams[socketID]?.destroyed) {
      this.recognizeStreams[socketID]?.destroy();
    }
  }

  private listenStream(connectedSocket: Socket, request: DialogFlowCX.IStreamingDetectIntentRequest) {
    this.destroyStream(connectedSocket.id);

    try {
      this.recognizeStreams[connectedSocket.id] = this.dfcxService.improvedDetectAudioStream(request, data => {
        if (data.recognitionResult) {
          if (data.recognitionResult?.transcript !== '') {
            connectedSocket.emit('stream-recognition-result', data);
          }
          console.log(`Intermediate Transcript: ${data.recognitionResult.transcript}`);
        } else {
          // connectedSocket.emit('intent-matched', data);
          const result = data.detectIntentResponse.queryResult;
          console.log(`Detected Intent: ${data.detectIntentResponse.queryResult?.intent?.displayName}`);

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
            if (data.detectIntentResponse.queryResult.match.matchType !== 'NO_INPUT') {
              connectedSocket.emit('stream-intent-matched', data);
            }

            this.destroyStream(connectedSocket.id);
          }
        }
      });

      console.log('listening');
    } catch (error) {
      console.error(error);

      // Restart the stream
      this.destroyStream(connectedSocket.id);
      this.listenStream(connectedSocket, request);
    }
  }

  private wrap<T>(func: (funcArgs: any) => T | Promise<T>) {
    return async (args: any, callback: (...args: any[]) => void) => {
      const response = await func.bind(this)(args);

      callback(response);
    };
  }

  async onDetectIntent(request: DialogFlowCX.IDetectIntentRequest) {
    return this.dfcxService.detectIntent(request);
  }

  async onDetectIntentText(message: string) {
    return this.dfcxService.detectIntentText(message);
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
