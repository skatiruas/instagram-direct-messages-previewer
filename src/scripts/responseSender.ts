import { ContentScriptMessage, InterceptorMessage, MessageType } from '../types';

// Redirect interceptor postMessages as chrome messages for serviceWorker
window.addEventListener('message', ({ data }: MessageEvent<InterceptorMessage>) => {
  switch (data.type) {
    case MessageType.InterceptedInboxResponse:
      chrome.runtime.sendMessage<ContentScriptMessage>({
        type: MessageType.RegisterInboxResponse,
        payload: data.payload,
      });
      break;
    case MessageType.InterceptedIgMessageSyncResponse:
      chrome.runtime.sendMessage<ContentScriptMessage>({
        type: MessageType.RegisterIgMessageSyncResponse,
        payload: data.payload,
      });
      break;
    case MessageType.InterceptedTranslatorData:
      chrome.runtime.sendMessage<ContentScriptMessage>({
        type: MessageType.RegisterTranslatorData,
        payload: data.payload,
      });
      break;
  }
});
