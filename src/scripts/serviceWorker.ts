import { TranslatorData } from '../translator/types';
import { ContentScriptMessage, MessageType, Thread, IgMessageSyncOp } from '../types';

// Database/API for saving and getting the intercepted responses
let threadMap: Record<string, Thread> | undefined = undefined;
let translatorData: Partial<TranslatorData> = {};
chrome.runtime.onMessage.addListener(({ type, payload }: ContentScriptMessage, _sender, sendResponse) => {
  switch (type) {
    case MessageType.RegisterInboxResponse:
      payload.inbox.threads.forEach((thread) => {
        threadMap = { ...threadMap, [thread.thread_id]: thread };
      });
      break;
    case MessageType.RegisterIgMessageSyncResponse:
      payload.event === 'patch' &&
        payload.data.forEach((igMessageSyncOp) => {
          patchThreadItem(igMessageSyncOp);
          patchThreadLastSeen(igMessageSyncOp);
        });
      break;
    case MessageType.GetThreads:
      sendResponse(threadMap && Object.values(threadMap));
      break;
    case MessageType.RegisterTranslatorData:
      translatorData = { ...translatorData, ...payload };
      break;
    case MessageType.GetTranslatorData:
      sendResponse(translatorData);
      break;
  }
});

function patchThreadItem({ path, op, value }: IgMessageSyncOp) {
  const [_, threadId, itemId] = path.match(/\/direct_v2\/threads\/(.*)\/items\/(.*)\/?$/) ?? [];
  if (threadId && itemId && threadMap && threadMap[threadId]) {
    switch (op) {
      case 'add':
        threadMap[threadId].items.push(JSON.parse(value));
        break;
      case 'remove':
        threadMap[threadId].items = threadMap[threadId].items.filter(({ item_id }) => item_id !== itemId);
        break;
      case 'replace':
        const items = threadMap[threadId].items;
        items[items.findIndex(({ item_id }) => item_id === itemId)] = JSON.parse(value);
        break;
    }
  }
}

function patchThreadLastSeen({ path, op, value }: IgMessageSyncOp) {
  const [_, threadId, userId] = path.match(/\/direct_v2\/threads\/(.*)\/participants\/(.*)\/has_seen\/?$/) ?? [];
  if (threadId && userId && threadMap && threadMap[threadId]) {
    switch (op) {
      case 'replace':
        threadMap[threadId].last_seen_at[userId] = JSON.parse(value);
        break;
    }
  }
}

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
