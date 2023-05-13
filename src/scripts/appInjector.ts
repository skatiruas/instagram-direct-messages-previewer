import { ContentScriptMessage, MessageType } from '../types';

const INJECTED_IFRAME_ID = 'instagramInboxPreviewerIframe';
const INJECTION_DELAY = 100;
function injectApp() {
  document.getElementById(INJECTED_IFRAME_ID)?.remove();

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

  const messageBoard = document.querySelectorAll('[style="height: 100%; width: 100%;"]')[2];
  messageBoard.appendChild(iframe);
}

chrome.runtime.onMessage.addListener(({ type }: ContentScriptMessage, _sender, sendResponse) => {
  sendResponse(type === MessageType.InjectApp && setTimeout(injectApp, INJECTION_DELAY));
});
