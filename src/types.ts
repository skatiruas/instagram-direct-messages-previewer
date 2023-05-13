export interface Item {
  item_id: string;
  timestamp: number;
  text?: string;
}

export interface Thread {
  thread_id: string;
  thread_title: string;
  read_state: number;
  items: Item[];
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
}

export interface Message<Type extends MessageType, Payload = undefined> {
  type: Type;
  payload: Payload;
}

export type InterceptorMessage = Message<MessageType.InterceptedInboxResponse, InboxResponse>;
export type ContentMessage = Message<MessageType.RegisterInboxResponse, InboxResponse>;
