import React, { useEffect, useState } from 'react';
import './App.css';
import { AppMessage, ContentScriptMessage, MessageType, Thread, Item, UnknownItem } from './types';
import { TranslatorFunction, TranslatorProvider, useTranslatorContext } from './translator/context';
import { getUnreadThreadItems } from './helpers';

function renderNotImplementedContent(...args: string[]) {
  return (
    <span className="instagramDirectMessagesPreviewerItem--unknown">{`${chrome.i18n.getMessage(
      'notYetImplemented'
    )}: ${args.join(' | ')}`}</span>
  );
}

function MediaComponent({ url, code }: { url: string; code?: string }) {
  const [base64, setBase64] = useState<string>();
  useEffect(() => {
    chrome.runtime.sendMessage<AppMessage>({ type: MessageType.ConvertToBase64, payload: url });
    chrome.runtime.onMessage.addListener(({ type, payload }: ContentScriptMessage) => {
      type === MessageType.UpdatedBase64Data && payload[url] && setBase64(payload[url]);
    });
  });

  return base64 ? (
    <a target="_blank" rel="noreferrer" href={code ? `https://www.instagram.com/p/${code}` : url}>
      <img src={base64} alt={url} />
    </a>
  ) : null;
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
    case 'media':
      return <MediaComponent url={item.media.image_versions2.candidates[0].url} />;
    case 'media_share': {
      if (item.direct_media_share) {
        const { image_versions2, code } = item.direct_media_share.media;
        return <MediaComponent url={image_versions2.candidates[0].url} code={code} />;
      } else if (item.media_share) {
        const { image_versions2, code } = item.media_share;
        return <MediaComponent url={image_versions2.candidates[0].url} code={code} />;
      } else {
        return renderNotImplementedContent((item as UnknownItem).item_type, ...Object.keys(item));
      }
    }
    case 'clip': {
      const { image_versions2, code } = item.clip.clip;
      return <MediaComponent url={image_versions2.candidates[0].url} code={code} />;
    }
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
  const sortedUnreadItems = getUnreadThreadItems(items, last_seen_at, viewer_id).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  if (!sortedUnreadItems.length) {
    return null;
  }

  return (
    <div key={thread_id} className="instagramDirectMessagesPreviewerThread">
      <div className="instagramDirectMessagesPreviewerThread__title">{thread_title}</div>
      {sortedUnreadItems.map((item) => (
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
