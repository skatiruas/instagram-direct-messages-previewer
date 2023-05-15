import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { ContentScriptMessage, MessageType, Thread, Item, UnknownItem } from './types';
import { TranslatorFunction, TranslatorProvider, useTranslatorContext } from './translator/context';

function renderNotImplementedContent(...args: string[]) {
  return <span className="instagramInboxPreviewerItem--unknown">{`Not implemented: ${args.join(' | ')}`}</span>;
}

function renderItemContent(item: Item, t: TranslatorFunction) {
  switch (item.item_type) {
    case 'text':
      return item.text;
    case 'reel_share':
      switch (item.reel_share.type) {
        case 'reaction':
          return t('reactedToYourStory', item.reel_share.text);
        case 'reply':
          return `${t('REPLIED_TO_YOUR_STORY')}: ${item.reel_share.text}`;
        default:
          return renderNotImplementedContent(item.item_type, item.reel_share.type);
      }
    case 'action_log':
      return item.action_log.description;
    default:
      return renderNotImplementedContent((item as UnknownItem).item_type);
  }
}

function ItemComponent(item: Item) {
  const { t } = useTranslatorContext();

  return (
    <div key={`${item.item_id}-${item.timestamp}`} className="instagramInboxPreviewerItem">
      {renderItemContent(item, t)}
    </div>
  );
}

function ThreadComponent({ thread_id, thread_title, items, last_seen_at, viewer_id }: Thread) {
  const viewerLastSeen = Number.parseInt(last_seen_at[viewer_id].timestamp);
  const filteredAndSortedItems = items
    .filter(({ timestamp }) => viewerLastSeen < timestamp)
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div key={thread_id} className="instagramInboxPreviewerThread">
      <div className="instagramInboxPreviewerThread__title">{thread_title}</div>
      {filteredAndSortedItems.map((item) => (
        <ItemComponent {...item} />
      ))}
    </div>
  );
}

function InstagramInboxPreviewer({ threads }: { threads: Thread[] }) {
  const { t } = useTranslatorContext();
  return (
    <div className="instagramInboxPreviewer">
      <div className="instagramInboxPreviewer__logo" />
      <div className="instagramInboxPreviewer__content">
        {threads.length ? threads.map((thread) => <ThreadComponent {...thread} />) : t('NO_MESSAGES')}
      </div>
    </div>
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
    chrome.runtime.onMessage.addListener(({ type, payload }: ContentScriptMessage) => {
      switch (type) {
        case MessageType.RegisterTranslatorData:
        case MessageType.RegisterInboxResponse:
          getThreads();
          break;
        case MessageType.InjectStyles:
          payload.forEach((styleElementOuterHTML) => (document.head.innerHTML += styleElementOuterHTML));
          break;
      }
    });
  }, [getThreads]);

  return (
    <TranslatorProvider>
      <InstagramInboxPreviewer threads={threads} />
    </TranslatorProvider>
  );
}

export default App;
