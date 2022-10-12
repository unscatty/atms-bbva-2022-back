import { Body, Controller, Post } from 'routing-controllers';

@Controller()
export class DialogFlowController {
  @Post('/echo')
  echo(@Body() data: any) {
    const tag = data.fulfillmentInfo.tag as string;
    let text = 'No entendi';

    if (tag === 'test') {
      text = 'Hola';
    }

    return {
      fulfillment_response: {
        messages: [
          {
            text: {
              text: [text]
            }
          }
        ]
      }
    };
  }
}
