import { Mesage } from '../types';

chrome.runtime.onInstalled.addListener(() => {
  const testMessage: Mesage<'installedMessage', boolean> = {
    type: 'installedMessage',
    payload: true,
  };
  console.log(testMessage);
});
