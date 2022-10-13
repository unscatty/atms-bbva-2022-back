import { Body, Controller, Post } from 'routing-controllers';

@Controller()
export class DialogFlowWebhookController {
  @Post('/echo')
  echo(@Body() data: DialogFlowCX.IWebhookRequest): DialogFlowCX.IWebhookResponse {
    const { tag } = data.fulfillmentInfo;
    const { text, transcript } = data;

    // const datos: DialogFlowCX;
    let newText = 'No entendi';

    if (tag === 'test') {
      newText = `Hola, dijiste: ${text || transcript}`;
    }

    // const req: DialogFlowCX.IWebhookRequest = {
    //   messages: [
    //     { payload}
    //   ]
    // }

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
