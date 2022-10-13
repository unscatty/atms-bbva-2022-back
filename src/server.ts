import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import { DialogFlowWebhookController } from '@/controllers/dialog-flow-webhook.controller';
import validateEnv from '@utils/validateEnv';

validateEnv();

const app = new App([IndexController, DialogFlowWebhookController]);
app.listen();
