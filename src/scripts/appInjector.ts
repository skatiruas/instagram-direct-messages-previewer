import { ContentScriptMessage, MessageType } from '../types';

const INJECTED_IFRAME_ID = 'instagramInboxPreviewerIframe';
function injectApp(injectionRetryTimeout: number) {
  // If already injected, leave it at the page
  if (document.getElementById(INJECTED_IFRAME_ID)) {
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('id', INJECTED_IFRAME_ID);
  iframe.setAttribute('src', chrome.runtime.getURL('index.html'));
  iframe.setAttribute('frameBorder', '0');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('hidden', 'hidden');
  iframe.setAttribute('style', 'overflow: hidden; height: 100%; width: 100%;');
  iframe.addEventListener('load', function (this) {
    const styleElements = document.querySelectorAll('style');
    const injectStylesMessage: ContentScriptMessage = {
      type: MessageType.InjectStyles,
      payload: Array.from(styleElements).map(({ outerHTML }) => outerHTML),
    };
    this.contentWindow?.postMessage(injectStylesMessage, '*');
    this.removeAttribute('hidden');
  });

  try {
    const messageBoard = document.querySelectorAll('[style="height: 100%; width: 100%;"]').item(2);
    messageBoard.appendChild(iframe);
  } catch {
    injectionRetryTimeout && setTimeout(() => injectApp(0), injectionRetryTimeout);
  }
}

chrome.runtime.onMessage.addListener(({ type }: ContentScriptMessage, _sender, sendResponse) => {
  sendResponse(type === MessageType.InjectApp && injectApp(100));
});
