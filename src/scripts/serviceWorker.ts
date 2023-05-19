import { AppMessage, MessageType } from '../types';

// Redirect AppMessages so responseSender can process them and send ContentScriptMessages
chrome.runtime.onMessage.addListener(async ({ type }: AppMessage, sender) => {
  switch (type) {
    case MessageType.GetTranslatorData:
    case MessageType.GetThreads:
      sender.tab?.id && chrome.tabs.sendMessage(sender.tab.id, { type });
      break;
  }
});
