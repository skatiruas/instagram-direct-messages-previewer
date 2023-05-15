export type TranslatorInstance = Record<
  string,
  string | object | Record<string, object> | ((...args: string[]) => object)
>;

export type StringOnlyTranslatorData = Record<'NO_MESSAGES' | 'REPLIED_TO_YOUR_STORY', string>;
export type ParamStringTranslatorData = Record<'reactedToYourStory', string>;
export type TranslatorData = StringOnlyTranslatorData & ParamStringTranslatorData;
