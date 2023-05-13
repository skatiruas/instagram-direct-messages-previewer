import { ContentMessage, MessageType, Thread } from '../types';

const threadMap: Record<string, Thread> = {};

chrome.runtime.onMessage.addListener(({ type, payload }: ContentMessage, _sender, sendResponse) => {
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
