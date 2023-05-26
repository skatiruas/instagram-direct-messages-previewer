import { AppMessage, MessageType } from '../types';

// Redirect AppMessages so responseSender can process them and send ContentScriptMessages
chrome.runtime.onMessage.addListener(async (appMessage: AppMessage, sender) => {
  switch (appMessage.type) {
    case MessageType.GetTranslatorData:
    case MessageType.GetThreads:
    case MessageType.ConvertToBase64:
      sender.tab?.id && chrome.tabs.sendMessage(sender.tab.id, appMessage);
      break;
  }
});
