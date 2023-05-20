import { TranslatorData } from './translator/types';

interface BaseItem {
  item_id: string;
  timestamp: number;
  hide_in_thread?: boolean;
  user_id: string;
}

export interface UnknownItem extends BaseItem {
  item_type: string;
}

export interface TextItem extends BaseItem {
  item_type: 'text';
  text: string;
}

export interface ActionLogItem extends BaseItem {
  item_type: 'action_log';
  action_log: {
    description: string;
    is_reaction_log: boolean;
  };
}

export interface ReelShareItem extends BaseItem {
  item_type: 'reel_share';
  reel_share: {
    text: string;
    type: 'reply' | 'reaction';
  };
}

export type Item = TextItem | ActionLogItem | ReelShareItem;
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

export interface IgMessageSyncOp {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value: string;
}

export interface IgMessageSyncResponse {
  data: IgMessageSyncOp[];
  event: 'patch';
}

export enum MessageType {
  InterceptedInboxResponse = 'interceptedInboxResponse',
  InterceptedIgMessageSyncResponse = 'interceptedIgMessageSyncResponse',
  InterceptedTranslatorData = 'interceptedTranslatorData',
  UpdatedThreads = 'updatedThreads',
  UpdatedTranslatorData = 'updatedTranslatorData',
  UpdatedStyles = 'updatedStyles',
  GetThreads = 'getThreads',
  GetTranslatorData = 'getTranslatorData',
}

export interface Message<Type extends MessageType> {
  type: Type;
}

export interface PayloadMessage<Type extends MessageType, Payload> extends Message<Type> {
  payload: Payload;
}

export type InterceptorMessage =
  | PayloadMessage<MessageType.InterceptedInboxResponse, InboxResponse>
  | PayloadMessage<MessageType.InterceptedIgMessageSyncResponse, IgMessageSyncResponse>
  | PayloadMessage<MessageType.InterceptedTranslatorData, Partial<TranslatorData>>;
export type ContentScriptMessage =
  | PayloadMessage<MessageType.UpdatedThreads, Thread[]>
  | PayloadMessage<MessageType.UpdatedTranslatorData, Partial<TranslatorData>>
  | PayloadMessage<MessageType.UpdatedStyles, HTMLStyleElement['outerHTML'][]>;
export type AppMessage = Message<MessageType.GetThreads> | Message<MessageType.GetTranslatorData>;
