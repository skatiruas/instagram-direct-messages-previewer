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
    type: 'reply' | 'reaction' | 'mention';
    media: Partial<Media>;
  };
}

export interface XmaReelShareItem extends BaseItem {
  item_type: 'xma_reel_share';
  auxiliary_text: string;
  message_item_type: string;
  reaction_image_url_info?: {
    url: string;
  };
  xma_reel_share: Array<{
    preview_url: string;
    target_url: string;
  }>;
}
interface Media {
  code?: string;
  image_versions2: {
    candidates: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

export interface MediaItem extends BaseItem {
  item_type: 'media';
  media: Media;
}

export interface MediaShareItem extends BaseItem {
  item_type: 'media_share';
  direct_media_share?: {
    media_share_type: 'tag';
    text: string;
    media: Media;
  };
  media_share?: Media;
}

export interface ClipItem extends BaseItem {
  item_type: 'clip';
  clip: {
    clip: Media;
  };
}

export interface LinkItem extends BaseItem {
  item_type: 'link';
  link: {
    link_context: {
      link_image_url: string;
      link_url: string;
    };
    text: string;
  };
}

export interface ProfileItem extends BaseItem {
  item_type: 'profile';
  preview_medias: Media[];
  profile: {
    full_name: string;
    profile_pic_url: string;
    username: string;
  };
}

export type Item =
  | TextItem
  | ActionLogItem
  | ReelShareItem
  | XmaReelShareItem
  | MediaItem
  | MediaShareItem
  | ClipItem
  | LinkItem
  | ProfileItem;

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
  UpdatedBase64Data = 'updatedBase64Data',
  UpdatedStyles = 'updatedStyles',
  GetThreads = 'getThreads',
  GetTranslatorData = 'getTranslatorData',
  ConvertToBase64 = 'convertToBase64',
}

export type Base64Data = Record<string, string>;

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
  | PayloadMessage<MessageType.UpdatedStyles, HTMLStyleElement['outerHTML'][]>
  | PayloadMessage<MessageType.UpdatedBase64Data, Base64Data>;
export type AppMessage =
  | Message<MessageType.GetThreads>
  | Message<MessageType.GetTranslatorData>
  | PayloadMessage<MessageType.ConvertToBase64, string>;
