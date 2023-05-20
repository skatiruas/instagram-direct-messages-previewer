import React, { useEffect, useState } from 'react';
import './App.css';
import { AppMessage, ContentScriptMessage, MessageType, Thread, Item, UnknownItem } from './types';
import { TranslatorFunction, TranslatorProvider, useTranslatorContext } from './translator/context';

function renderNotImplementedContent(...args: string[]) {
  return (
    <span className="instagramDirectMessagesPreviewerItem--unknown">{`${chrome.i18n.getMessage(
      'notYetImplemented'
    )}: ${args.join(' | ')}`}</span>
  );
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
    <div key={`${item.item_id}-${item.timestamp}`} className="instagramDirectMessagesPreviewerItem">
      {renderItemContent(item, t)}
    </div>
  );
}

function ThreadComponent({ thread_id, thread_title, items, last_seen_at, viewer_id }: Thread) {
  const viewerLastSeen = Number.parseInt(last_seen_at[viewer_id].timestamp);
  const filteredAndSortedItems = items
    .filter(({ timestamp }) => viewerLastSeen < timestamp)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!filteredAndSortedItems.length) {
    return null;
  }

  return (
    <div key={thread_id} className="instagramDirectMessagesPreviewerThread">
      <div className="instagramDirectMessagesPreviewerThread__title">{thread_title}</div>
      {filteredAndSortedItems.map((item) => (
        <ItemComponent {...item} />
      ))}
    </div>
  );
}

function InstagramDirectMessagesPreviewer({ threads }: { threads: Thread[] | undefined }) {
  const { t } = useTranslatorContext();

  return (
    <div className="instagramDirectMessagesPreviewer">
      <div
        title={chrome.i18n.getMessage('appName')}
        className={`instagramDirectMessagesPreviewer__logo ${
          !threads ? 'instagramDirectMessagesPreviewer__logo--loading' : ''
        }`}
      />
      {threads && (
        <div className="instagramDirectMessagesPreviewer__content">
          {threads.length ? threads.map((thread) => <ThreadComponent {...thread} />) : t('NO_MESSAGES')}
        </div>
      )}
    </div>
  );
}

function App() {
  const [threads, setThreads] = useState<Thread[]>();

  useEffect(() => {
    chrome.runtime.sendMessage<AppMessage>({ type: MessageType.GetThreads });
    chrome.runtime.onMessage.addListener(({ type, payload }: ContentScriptMessage) => {
      type === MessageType.UpdatedStyles && payload.forEach((outerHTML) => (document.head.innerHTML += outerHTML));
      type === MessageType.UpdatedThreads && setThreads(payload?.filter(({ read_state }) => read_state));
    });
  }, []);

  return (
    <TranslatorProvider>
      <InstagramDirectMessagesPreviewer threads={threads} />
    </TranslatorProvider>
  );
}

export default App;
