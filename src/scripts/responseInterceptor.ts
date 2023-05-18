import { generateTranslatorData } from '../translator/helpers';
import { InterceptorMessage, MessageType } from '../types';

const inboxApiRegExp = /^\/api\/v1\/direct_v2\/inbox\/$/;

// Intercept wanted responses in the Main World and send them as postMessage to Isolated World
(function ({ prototype }) {
  const { send } = prototype;

  prototype.send = function (body) {
    this.addEventListener('load', function () {
      let interceptorMessage: InterceptorMessage | undefined;

      const url = new URL(this.responseURL);
      if (inboxApiRegExp.test(url.pathname)) {
        interceptorMessage = {
          type: MessageType.InterceptedInboxResponse,
          payload: JSON.parse(this.response),
        };
      }
      interceptorMessage && window.postMessage(interceptorMessage, '*');
    });

    return send.apply(this, [body]);
  };
})(XMLHttpRequest);

// Intercept wanted WebSocket responses in the Main World and send them as postMessage to Isolated World
(function ({ prototype }) {
  const dataDescriptor = Object.getOwnPropertyDescriptor(prototype, 'data') ?? {};

  Object.defineProperty(prototype, 'data', {
    ...dataDescriptor,
    get: function () {
      const value = dataDescriptor.get?.call(this);

      if (this.currentTarget instanceof WebSocket && value) {
        const [_, igMessageSyncString] = new TextDecoder().decode(value).match(/ig_message_sync[^\[]*\[(.*)\]/) ?? [];
        if (igMessageSyncString) {
          const interceptedIgMessageSyncResponse: InterceptorMessage = {
            type: MessageType.InterceptedIgMessageSyncResponse,
            payload: JSON.parse(igMessageSyncString),
          };
          window.postMessage(interceptedIgMessageSyncResponse, '*');
        }
      }

      return value;
    },
  });
})(MessageEvent);

// Intercept translation strings on Instagram window
document.addEventListener('DOMContentLoaded', () => {
  const polarisDirectStrings = (window as any).importNamespace?.('PolarisDirectStrings');
  polarisDirectStrings &&
    window.postMessage(
      {
        type: MessageType.InterceptedTranslatorData,
        payload: generateTranslatorData(polarisDirectStrings),
      },
      '*'
    );
});
