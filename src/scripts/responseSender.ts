import { ContentMessage, InterceptorMessage, MessageType } from '../types';

// Redirect interceptor postMessages as chrome messages for serviceWorker
window.addEventListener('message', ({ data }: MessageEvent<InterceptorMessage>) => {
  switch (data.type) {
    case MessageType.InterceptedInboxResponse:
      chrome.runtime.sendMessage<ContentMessage>({
        type: MessageType.RegisterInboxResponse,
        payload: data.payload,
      });
      break;
  }
});
