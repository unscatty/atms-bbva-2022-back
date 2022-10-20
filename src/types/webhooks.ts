import { LocationPayload, ResponseMessagePayload } from '@interfaces/dialogflow-webhooks/streaming-payload.interface';

export type LocationWebhookRequest = DialogFlowCX.IWebhookRequest & {
  payload?: LocationPayload;
};

export type PayloadWebhookResponseMessage = DialogFlowCX.IResponseMessage & {
  payload?: ResponseMessagePayload;
};

export type PayloadedWebhookResponse = DialogFlowCX.IWebhookResponse & {
  fulfillmentResponse?: DialogFlowCX.WebhookResponse.IFulfillmentResponse & {
    messages?: PayloadWebhookResponseMessage[] | null;
  };
};
