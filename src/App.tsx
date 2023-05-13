import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { ContentScriptMessage, Item, MessageType, Thread } from './types';

function ItemComponent({ item_id, timestamp, text, action_log, reel_share }: Item) {
  return (
    <li key={`${item_id}-${timestamp}`} className="instagramInboxPreviewerItem">
      {text || action_log?.description || reel_share?.text}
    </li>
  );
}

function ThreadComponent({ thread_id, thread_title, items, last_seen_at, viewer_id }: Thread) {
  const viewerLastSeen = Number.parseInt(last_seen_at[viewer_id].timestamp);
  const filteredAndSortedItems = items
    .filter(({ timestamp }) => viewerLastSeen < timestamp)
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <ul key={thread_id} className="instagramInboxPreviewerThread">
      <div className="instagramInboxPreviewerThread__title">{thread_title}</div>
      {filteredAndSortedItems.map((item) => (
        <ItemComponent {...item} />
      ))}
    </ul>
  );
}

function App() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const getThreads = useCallback(() => {
    chrome.runtime.sendMessage<ContentScriptMessage, Thread[]>(
      { type: MessageType.GetThreads, payload: undefined },
      (threads) => setThreads(threads.filter(({ read_state }) => read_state))
    );
  }, []);

  useEffect(() => {
    getThreads();
    chrome.runtime.onMessage.addListener(({ type }: ContentScriptMessage, _sender, sendResponse) => {
      sendResponse(type === MessageType.RegisterInboxResponse && getThreads());
    });
  }, [getThreads]);

  return (
    <div className="instagramInboxPreviewer">
      <div className="instagramInboxPreviewer__logo" />
      <div className="instagramInboxPreviewer__content">
        {threads.map((thread) => (
          <ThreadComponent {...thread} />
        ))}
      </div>
    </div>
  );
}

export default App;
