import App from '@/app';
import { IndexController } from '@controllers/index.controller';
import { DialogFlowController } from '@controllers/dialog-flow.controller';
import validateEnv from '@utils/validateEnv';

validateEnv();

const app = new App([IndexController, DialogFlowController]);
app.listen();
