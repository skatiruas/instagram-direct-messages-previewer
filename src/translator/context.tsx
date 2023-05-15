import React, { useCallback, useEffect, useState } from 'react';
import { ContentScriptMessage, MessageType } from '../types';
import { TranslatorData } from './types';
import { getTranslationValue } from './helpers';

export type TranslatorFunction = (key: keyof TranslatorData, ...args: string[]) => string;

const TranslationContext = React.createContext<{ t: TranslatorFunction }>({
  t: () => '',
});

export const useTranslatorContext = () => React.useContext(TranslationContext);

export const TranslatorProvider = ({ children }: { children: React.ReactNode }) => {
  const [translatorData, setTranslatorData] = useState<TranslatorData>({} as TranslatorData);

  useEffect(() => {
    chrome.runtime.sendMessage<ContentScriptMessage, TranslatorData>(
      { type: MessageType.GetTranslatorData, payload: undefined },
      (partialAppStrings) => setTranslatorData({ ...translatorData, ...partialAppStrings })
    );
  }, []);

  const t = useCallback<TranslatorFunction>(
    (key, ...args) => getTranslationValue(translatorData, key, ...args),
    [translatorData]
  );

  return <TranslationContext.Provider value={{ t }}>{children}</TranslationContext.Provider>;
};
