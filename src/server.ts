import 'reflect-metadata';
import App from '@/app';
import { DialogFlowWebhookController } from '@/controllers/dialog-flow-webhook.controller';
import { NODE_ENV, ORIGIN, PORT, SOCKETS_PORT } from '@config';
import { IndexController } from '@controllers/index.controller';
import { MessageController } from '@controllers/message.socket.controller';
import { logger } from '@utils/logger';
import validateEnv from '@utils/validateEnv';
import { useSocketServer } from 'socket-controllers';
import { Server } from 'socket.io';
import DialogFlowCXSocketController from './controllers/dialog-flow.socket.controller';
import Container from 'typedi';
import { useContainer as useSocketContainer } from 'socket-controllers';
import { createServer } from 'http';

// try {
validateEnv();

useSocketContainer(Container);

const app = new App([IndexController, DialogFlowWebhookController]);
// app.listen();
const server = createServer(app.app);

// const io = new Server(/* parseInt(SOCKETS_PORT) */);
const io = new Server(server, {
  cors: {
    origin: ORIGIN,
  },
});

server.listen(parseInt(PORT), () => {
  logger.info(`=================================`);
  logger.info(`======= ENV: ${NODE_ENV} =======`);
  logger.info(`🚀 App listening on the port ${PORT}`);
  logger.info(`=================================`);
});

try {
  useSocketServer(io, {
    controllers: [MessageController, DialogFlowCXSocketController],
  });
} catch (error) {
  logger.error(error);
}

logger.info(`Socket.io server running or port: ${PORT}`);
