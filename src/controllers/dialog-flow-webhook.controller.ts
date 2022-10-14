import { Body, Controller, Post } from 'routing-controllers';

@Controller()
export class DialogFlowWebhookController {
  @Post('/echo')
  echo(@Body() data: DialogFlowCX.IWebhookRequest): DialogFlowCX.IWebhookResponse {
    const { tag } = data.fulfillmentInfo;
    const { text, transcript } = data;

    let newText = '';

    if (tag === 'test') {
      newText = `Hey! you said ${text || transcript}`;
    }

    return {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [newText],
            },
          },
        ],
      },
    };
  }
}
