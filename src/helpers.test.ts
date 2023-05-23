import { getUnreadThreadItems } from './helpers';

describe('getUnreadThreadItems', () => {
  it('shows only items above the viewers last_seen_at and that are not from the viewer', () => {
    expect(
      getUnreadThreadItems(
        [
          { item_id: 'a', item_type: 'text', text: 'Me before', timestamp: 0, user_id: 'me' },
          { item_id: 'b', item_type: 'text', text: 'You before', timestamp: 20, user_id: 'you' },
          { item_id: 'c', item_type: 'text', text: 'Them before', timestamp: 40, user_id: 'them' },
          { item_id: 'd', item_type: 'text', text: 'Me after', timestamp: 60, user_id: 'me' },
          { item_id: 'e', item_type: 'text', text: 'You after', timestamp: 80, user_id: 'you' },
          { item_id: 'f', item_type: 'text', text: 'Them after', timestamp: 100, user_id: 'them' },
        ],
        {
          me: { item_id: '0', timestamp: '50' },
        },
        'me'
      )
    ).toEqual([
      { item_id: 'e', item_type: 'text', text: 'You after', timestamp: 80, user_id: 'you' },
      { item_id: 'f', item_type: 'text', text: 'Them after', timestamp: 100, user_id: 'them' },
    ]);
  });
});
