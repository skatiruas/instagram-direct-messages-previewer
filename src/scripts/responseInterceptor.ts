import { generateTranslatorData } from '../translator/helpers';
import { InterceptorMessage, MessageType } from '../types';

const inboxApiRegExp = /^\/api\/v1\/direct_v2\/inbox\/$/;

// Intercept wanted responses in the Main World and send them as postMessage to Isolated World
(function ({ prototype }) {
  const { open, send } = prototype;

  prototype.open = function (
    method: string,
    originalUrl: string | URL,
    async?: boolean,
    username?: string | null | undefined,
    password?: string | null | undefined
  ) {
    const url = new URL(originalUrl, window.location.origin);
    if (inboxApiRegExp.test(url.pathname) && url.searchParams.get('thread_message_limit')) {
      url.searchParams.set('thread_message_limit', '5');
    }
    open.apply(this, [method, url, async ?? false, username, password]);
  };

  prototype.send = function (body) {
    this.addEventListener('load', function () {
      let interceptorMessage: InterceptorMessage | undefined;

      const url = new URL(this.responseURL, window.location.origin);
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

// Extract translation strings on Instagram window
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
