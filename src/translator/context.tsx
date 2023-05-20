import React, { useCallback, useEffect, useState } from 'react';
import { AppMessage, ContentScriptMessage, MessageType } from '../types';
import { TranslatorData } from './types';
import { getTranslationValue } from './helpers';

export type TranslatorFunction = (key: keyof TranslatorData, ...args: string[]) => string;

const TranslationContext = React.createContext<{ t: TranslatorFunction }>({
  t: () => '',
});

export const useTranslatorContext = () => React.useContext(TranslationContext);

export const TranslatorProvider = ({ children }: { children: React.ReactNode }) => {
  const [translatorData, setTranslatorData] = useState<TranslatorData>({
    NO_MESSAGES: chrome.i18n.getMessage('NO_MESSAGES'),
    REPLIED_TO_YOUR_STORY: chrome.i18n.getMessage('REPLIED_TO_YOUR_STORY'),
    reactedToYourStory: chrome.i18n.getMessage('reactedToYourStory'),
  });

  useEffect(() => {
    chrome.runtime.sendMessage<AppMessage>({ type: MessageType.GetTranslatorData });
    chrome.runtime.onMessage.addListener(({ type, payload }: ContentScriptMessage) => {
      type === MessageType.UpdatedTranslatorData && setTranslatorData((data) => ({ ...data, ...payload }));
    });
  }, []);

  const t = useCallback<TranslatorFunction>(
    (key, ...args) => getTranslationValue(translatorData, key, ...args),
    [translatorData]
  );

  return <TranslationContext.Provider value={{ t }}>{children}</TranslationContext.Provider>;
};
