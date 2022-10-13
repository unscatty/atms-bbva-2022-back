import { Service, Inject } from 'typedi';
import { ConnectedSocket, EmitOnFail, EmitOnSuccess, MessageBody, OnConnect, OnMessage, SocketController } from 'socket-controllers';
import { Socket } from 'socket.io';
import DialogFlowCXService, { defaultDialogFlowCXService } from '@services/dialog-flow-cx.service';

@Service()
@SocketController('/chat')
export default class DialogFlowCXSocketController {
  constructor(private dfcxService: DialogFlowCXService) {}

  @OnConnect()
  onConnect(@ConnectedSocket() socket: Socket) {
    socket.emit('connected');
  }

  @OnMessage('detect-intent')
  @EmitOnFail('detect-intent-failed')
  @EmitOnSuccess('detected-intent')
  async onDetectIntent(@MessageBody() message: string) {
    try {
      const response = await this.dfcxService.detectIntent(message);
      return { response };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
