import { TranslatorData } from '../translator/types';
import {
  AppMessage,
  Base64Data,
  ContentScriptMessage,
  IgMessageSyncOp,
  InterceptorMessage,
  MessageType,
  Thread,
} from '../types';
import { getUnreadThreadItems } from '../helpers';

let threadMap: Record<string, Thread> | undefined;
function sendUpdatedThreadsMessage() {
  if (threadMap) {
    chrome.runtime.sendMessage<ContentScriptMessage>({
      type: MessageType.UpdatedThreads,
      payload: Object.values(threadMap),
    });
  }
}

let translatorData: Partial<TranslatorData> = {};
function sendUpdatedTranslatorDataMessage() {
  chrome.runtime.sendMessage<ContentScriptMessage>({
    type: MessageType.UpdatedTranslatorData,
    payload: translatorData,
  });
}

const base64Data: Base64Data = {};
function sendUpdatedBase64DataMessage() {
  chrome.runtime.sendMessage<ContentScriptMessage>({
    type: MessageType.UpdatedBase64Data,
    payload: base64Data,
  });
}

// Save intercepted responses in sessionStorage and send updated payloads as ContentScriptMessage
window.addEventListener('message', ({ data }: MessageEvent<InterceptorMessage>) => {
  switch (data.type) {
    case MessageType.InterceptedInboxResponse:
      threadMap = data.payload.inbox.threads.reduce(
        (acc, thread) => ({ ...acc, [thread.thread_id]: thread }),
        threadMap ?? {}
      );
      sendUpdatedThreadsMessage();
      break;
    case MessageType.InterceptedIgMessageSyncResponse:
      data.payload.event === 'patch' &&
        data.payload.data.forEach((igMessageSyncOp) => {
          patchThreadItem(igMessageSyncOp) || patchThreadLastSeen(igMessageSyncOp);
        });
      sendUpdatedThreadsMessage();
      break;
    case MessageType.InterceptedTranslatorData:
      translatorData = { ...translatorData, ...data.payload };
      sendUpdatedTranslatorDataMessage();
      break;
  }
});

function patchThreadItem({ path, op, value }: IgMessageSyncOp): boolean {
  const [_, threadId, itemId] = path.match(/\/direct_v2\/threads\/(.*)\/items\/(.*)\/?$/) ?? [];
  if (threadMap && threadId && itemId && threadMap[threadId]) {
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
    updateThreadReadState(threadMap[threadId]);
    return true;
  }
  return false;
}

function patchThreadLastSeen({ path, op, value }: IgMessageSyncOp): boolean {
  const [_, threadId, userId] = path.match(/\/direct_v2\/threads\/(.*)\/participants\/(.*)\/has_seen\/?$/) ?? [];
  if (threadMap && threadId && userId && threadMap[threadId]) {
    switch (op) {
      case 'replace':
        threadMap[threadId].last_seen_at[userId] = JSON.parse(value);
        break;
    }
    updateThreadReadState(threadMap[threadId]);
    return true;
  }
  return false;
}

function updateThreadReadState(thread: Thread) {
  thread.read_state = getUnreadThreadItems(thread.items, thread.last_seen_at, thread.viewer_id).length ? 1 : 0;
}

// Transform AppMessages into ContentScriptMessages with payload
chrome.runtime.onMessage.addListener(async (appMessage: AppMessage) => {
  switch (appMessage.type) {
    case MessageType.GetThreads:
      sendUpdatedThreadsMessage();
      break;
    case MessageType.GetTranslatorData:
      sendUpdatedTranslatorDataMessage();
      break;
    case MessageType.ConvertToBase64: {
      if (base64Data[appMessage.payload]) {
        sendUpdatedBase64DataMessage();
      } else {
        const response = await fetch(appMessage.payload);
        const fileReader = new FileReader();
        fileReader.readAsDataURL(await response.blob());
        fileReader.onloadend = function () {
          base64Data[appMessage.payload] = `${fileReader.result}`;
          sendUpdatedBase64DataMessage();
        };
      }
    }
  }
});
