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
