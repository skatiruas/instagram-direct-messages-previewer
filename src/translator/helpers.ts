import { TranslatorInstance, TranslatorData } from './types';

const possibleArgs = ['$1', '$2', '$3'];

export function generateTranslatorData(translatorInstance: TranslatorInstance): TranslatorData {
  return Object.keys(translatorInstance).reduce((acc, property) => {
    let currentValue = translatorInstance[property];
    if (typeof currentValue === 'function') {
      currentValue = currentValue(...possibleArgs);
    }
    return { ...acc, [property]: JSON.parse(JSON.stringify(currentValue)) };
  }, {} as TranslatorData);
}

export function getTranslationValue(data: TranslatorData, key: keyof TranslatorData, ...args: string[]): string {
  return args.reduce((acc, argValue, index) => acc.replace(possibleArgs[index], argValue), data[key] ?? '');
}
