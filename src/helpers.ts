import { Thread } from './types';

export function getUnreadThreadItems(
  items: Thread['items'],
  last_seen_at: Thread['last_seen_at'],
  viewer_id: Thread['viewer_id']
) {
  const viewerLastSeen = Number.parseInt(last_seen_at[viewer_id].timestamp);
  return items.filter(({ timestamp, user_id }) => user_id !== viewer_id && viewerLastSeen < timestamp);
}
