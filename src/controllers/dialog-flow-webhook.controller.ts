import { Body, Controller, Post } from 'routing-controllers';

@Controller()
export class DialogFlowWebhookController {
  @Post('/echo')
  echo(@Body() data: DialogFlowCX.IWebhookRequest): DialogFlowCX.IWebhookResponse {
    const { tag } = data.fulfillmentInfo;
    const { text, transcript } = data;

    let newText = 'No entendi';

    if (tag === 'test') {
      newText = `Hola, dijiste: ${text || transcript}`;
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
