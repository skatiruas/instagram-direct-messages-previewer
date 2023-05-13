import { ContentScriptMessage, MessageType, Thread } from '../types';

// Database/API for saving and getting the intercepted responses
const threadMap: Record<string, Thread> = {};
chrome.runtime.onMessage.addListener(({ type, payload }: ContentScriptMessage, _sender, sendResponse) => {
  let response;
  switch (type) {
    case MessageType.RegisterInboxResponse:
      payload.inbox.threads.forEach((thread) => {
        threadMap[thread.thread_id] = thread;
      });
      break;
    case MessageType.GetThreads:
      response = Object.values(threadMap);
      break;
  }
  sendResponse(response);
});

// Logic for firing appInjector script
const inboxViewRegExp = /^\/direct\/inbox|new\/$/;
const loadingUrls: Record<number, string | undefined> = {};
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) {
    return;
  } else if (changeInfo.status === 'loading') {
    loadingUrls[tabId] = changeInfo.url || tab.url;
  } else if (changeInfo.status === 'complete') {
    const loadedUrl = loadingUrls[tabId];
    if (inboxViewRegExp.test(new URL(tab.url).pathname) && (!loadedUrl || loadedUrl === tab.url)) {
      chrome.tabs.sendMessage<ContentScriptMessage>(tabId, {
        type: MessageType.InjectApp,
        payload: undefined,
      });
    }
    loadingUrls[tabId] = undefined;
  }
});
