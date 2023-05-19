import { TranslatorData } from '../translator/types';
import { AppMessage, ContentScriptMessage, IgMessageSyncOp, InterceptorMessage, MessageType, Thread } from '../types';

const threadMapId = 'instagramInboxPreviewerThreadMap';
type ThreadMap = Record<string, Thread> | undefined;
function getThreadMap(): ThreadMap {
  const threadMapString = window.sessionStorage.getItem(threadMapId);
  return threadMapString ? JSON.parse(threadMapString) : undefined;
}
function sendUpdatedThreadsMessage() {
  const threadMap = getThreadMap();
  if (threadMap) {
    chrome.runtime.sendMessage<ContentScriptMessage>({
      type: MessageType.UpdatedThreads,
      payload: Object.values(threadMap),
    });
  }
}

const translatorDataId = 'instagramInboxPreviewerTranslatorData';
function getTranslatorData(): TranslatorData {
  return JSON.parse(window.sessionStorage.getItem(translatorDataId) ?? '{}');
}
function sendUpdatedTranslatorDataMessage() {
  chrome.runtime.sendMessage<ContentScriptMessage>({
    type: MessageType.UpdatedTranslatorData,
    payload: getTranslatorData(),
  });
}

// Save intercepted responses in sessionStorage and send updated payloads as ContentScriptMessage
window.addEventListener('message', ({ data }: MessageEvent<InterceptorMessage>) => {
  switch (data.type) {
    case MessageType.InterceptedInboxResponse:
      const threadMap = getThreadMap() ?? {};
      data.payload.inbox.threads.forEach((thread) => (threadMap[thread.thread_id] = thread));
      window.sessionStorage.setItem(threadMapId, JSON.stringify(threadMap));
      sendUpdatedThreadsMessage();
      break;
    case MessageType.InterceptedIgMessageSyncResponse:
      data.payload.event === 'patch' &&
        data.payload.data.forEach((igMessageSyncOp) => {
          const patchedThreadMap = patchThreadItem(igMessageSyncOp) || patchThreadLastSeen(igMessageSyncOp);
          patchedThreadMap && window.sessionStorage.setItem(threadMapId, JSON.stringify(patchedThreadMap));
        });
      sendUpdatedThreadsMessage();
      break;
    case MessageType.InterceptedTranslatorData:
      window.sessionStorage.setItem(translatorDataId, JSON.stringify(data.payload));
      sendUpdatedTranslatorDataMessage();
      break;
  }
});

function patchThreadItem({ path, op, value }: IgMessageSyncOp): ThreadMap {
  const [_, threadId, itemId] = path.match(/\/direct_v2\/threads\/(.*)\/items\/(.*)\/?$/) ?? [];
  const threadMap = getThreadMap() ?? {};
  if (threadMap && threadId && itemId && threadMap[threadId]) {
    switch (op) {
      case 'add':
        threadMap[threadId].items.push(JSON.parse(value));
        return threadMap;
      case 'remove':
        threadMap[threadId].items = threadMap[threadId].items.filter(({ item_id }) => item_id !== itemId);
        return threadMap;
      case 'replace':
        const items = threadMap[threadId].items;
        items[items.findIndex(({ item_id }) => item_id === itemId)] = JSON.parse(value);
        return threadMap;
    }
  }
}

function patchThreadLastSeen({ path, op, value }: IgMessageSyncOp): ThreadMap {
  const [_, threadId, userId] = path.match(/\/direct_v2\/threads\/(.*)\/participants\/(.*)\/has_seen\/?$/) ?? [];
  const threadMap = getThreadMap() ?? {};
  if (threadMap && threadId && userId && threadMap[threadId]) {
    switch (op) {
      case 'replace':
        threadMap[threadId].last_seen_at;
        threadMap[threadId].last_seen_at[userId] = JSON.parse(value);
        return threadMap;
    }
  }
}

// Transform AppMessages into ContentScriptMessages with payload
chrome.runtime.onMessage.addListener(({ type }: AppMessage) => {
  switch (type) {
    case MessageType.GetThreads:
      sendUpdatedThreadsMessage();
      break;
    case MessageType.GetTranslatorData:
      sendUpdatedTranslatorDataMessage();
      break;
  }
});
