import 'reflect-metadata';
import App from '@/app';
import { DialogFlowWebhookController } from '@/controllers/dialog-flow-webhook.controller';
import { SOCKETS_PORT } from '@config';
import { IndexController } from '@controllers/index.controller';
import { MessageController } from '@controllers/message.socket.controller';
import { logger } from '@utils/logger';
import validateEnv from '@utils/validateEnv';
import { useSocketServer } from 'socket-controllers';
import { Server } from 'socket.io';
import DialogFlowCXSocketController from './controllers/dialog-flow.socket.controller';
import Container from 'typedi';
import { useContainer as useSocketContainer } from 'socket-controllers';

// try {
validateEnv();

useSocketContainer(Container);

const app = new App([IndexController, DialogFlowWebhookController]);
app.listen();

const io = new Server(parseInt(SOCKETS_PORT));

try {
  useSocketServer(io, {
    controllers: [MessageController, DialogFlowCXSocketController],
  });
} catch (error) {
  logger.error(error);
}

logger.info(`Socket.io server running or port: ${SOCKETS_PORT}`);