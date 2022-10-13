import { ConnectedSocket, MessageBody, OnConnect, OnMessage, SocketController } from 'socket-controllers';
import { Socket } from 'socket.io';

@SocketController('/chat')
export default class DialogFlowCXSocketController {
  @OnConnect()
  onConnect(@ConnectedSocket() socket: Socket) {
    socket.emit('connected');
  }

  @OnMessage('detect-intent')
  onRandom(@ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    socket.emit('echo', { echo: message });
  }
}
