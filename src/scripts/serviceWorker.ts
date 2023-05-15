import { TranslatorData } from '../translator/types';
import { ContentScriptMessage, MessageType, Thread } from '../types';

// Database/API for saving and getting the intercepted responses
const threadMap: Record<string, Thread> = {};
let translatorData: Partial<TranslatorData> = {};
chrome.runtime.onMessage.addListener(({ type, payload }: ContentScriptMessage, _sender, sendResponse) => {
  switch (type) {
    case MessageType.RegisterInboxResponse:
      payload.inbox.threads.forEach((thread) => {
        threadMap[thread.thread_id] = thread;
      });
      break;
    case MessageType.GetThreads:
      sendResponse(Object.values(threadMap));
      break;
    case MessageType.RegisterTranslatorData:
      translatorData = { ...translatorData, ...payload };
      break;
    case MessageType.GetTranslatorData:
      sendResponse(translatorData);
      break;
  }
});

// Logic for firing appInjector script
const inboxViewRegExp = /^\/direct\/inbox|new\/$/;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (inboxViewRegExp.test(new URL(tab.url).pathname)) {
      chrome.tabs.sendMessage<ContentScriptMessage>(tabId, {
        type: MessageType.InjectApp,
        payload: undefined,
      });
    }
  }
});
