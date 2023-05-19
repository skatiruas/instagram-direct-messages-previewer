import { ContentScriptMessage, MessageType } from '../types';

const INBOX_VIEW_REG_EXP = /^\/direct\/inbox|new\/$/;
const INJECTED_IFRAME_ID = 'instagramDirectMessagesPreviewerIframe';
function injectApp(injectionRetryTimeout: number) {
  if (!INBOX_VIEW_REG_EXP.test(window.location.pathname) || document.getElementById(INJECTED_IFRAME_ID)) {
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
    chrome.runtime.sendMessage<ContentScriptMessage>({
      type: MessageType.UpdatedStyles,
      payload: Array.from(styleElements).map(({ outerHTML }) => outerHTML),
    });
    this.removeAttribute('hidden');
  });

  requestAnimationFrame(() => {
    try {
      const fullExtensionElements = document.querySelectorAll('[style="height: 100%; width: 100%;"]');
      const messageBoard = fullExtensionElements.item(fullExtensionElements.length - 1);
      if (
        injectionRetryTimeout &&
        (messageBoard.firstElementChild?.tagName !== 'svg' || !messageBoard.lastElementChild?.querySelector('button'))
      ) {
        throw 'Injection place not found';
      }
      messageBoard.appendChild(iframe);
    } catch {
      injectionRetryTimeout && setTimeout(() => injectApp(injectionRetryTimeout - 10), injectionRetryTimeout);
    }
  });
}

new MutationObserver(() => injectApp(100)).observe(document.body, {
  attributes: false,
  childList: true,
  subtree: false,
});
