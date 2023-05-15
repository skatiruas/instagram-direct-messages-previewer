import { TranslatorData } from './translator/types';

export interface Item {
  item_id: string;
  timestamp: number;
  text?: string;
  hide_in_thread?: boolean;
  user_id: string;
  action_log?: {
    description: string;
    is_reaction_log: boolean;
  };
  reel_share?: {
    text: string;
  };
}

export interface Thread {
  thread_id: string;
  thread_title: string;
  read_state: number;
  items: Item[];
  viewer_id: string;
  last_seen_at: Record<
    string,
    {
      item_id: Item['item_id'];
      timestamp: string;
    }
  >;
}

export interface Inbox {
  threads: Thread[];
}

export interface InboxResponse {
  inbox: Inbox;
}

export enum MessageType {
  InterceptedInboxResponse = 'interceptedInboxResponse',
  RegisterInboxResponse = 'registerInboxResponse',
  GetThreads = 'getThreads',
  InterceptedTranslatorData = 'interceptedTranslatorData',
  RegisterTranslatorData = 'registerTranslatorData',
  GetTranslatorData = 'getTranslatorData',
  InjectApp = 'injectApp',
  InjectStyles = 'injectStyles',
}

export interface Message<Type extends MessageType, Payload = undefined> {
  type: Type;
  payload: Payload;
}

export type InterceptorMessage =
  | Message<MessageType.InterceptedInboxResponse, InboxResponse>
  | Message<MessageType.InterceptedTranslatorData, TranslatorData>;
export type ContentScriptMessage =
  | Message<MessageType.RegisterInboxResponse, InboxResponse>
  | Message<MessageType.GetThreads>
  | Message<MessageType.RegisterTranslatorData, TranslatorData>
  | Message<MessageType.GetTranslatorData>
  | Message<MessageType.InjectApp>
  | Message<MessageType.InjectStyles, HTMLStyleElement['outerHTML'][]>;
