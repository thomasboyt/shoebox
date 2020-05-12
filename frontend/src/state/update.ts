import produce, { Draft } from 'immer';
import { Action } from './actions';
import { Effect } from './effects';
import { WorldState, Position } from './models';

export const CALL_MAX_RADIUS = 80;
function inCallRadius(a: Position, b: Position): boolean {
  const distance = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  return distance < CALL_MAX_RADIUS * 2;
}

function getUserIdByPeerId(state: WorldState, peerId: string): string {
  const userId = Object.keys(state.roomState!.users).find(
    (userId) => state.roomState!.users[userId].peerId === peerId
  );
  if (!userId) {
    throw new Error(`no user found for peer ${peerId}`);
  }
  return userId;
}

function updateConfirmedMove(state: Draft<WorldState>): Effect[] {
  const roomState = state.roomState!;
  const position = roomState.positions[state.userId!];

  const effects: Effect[] = [];

  for (const userId of Object.keys(roomState.users)) {
    if (userId === state.userId) {
      continue;
    }

    const shouldOpen = inCallRadius(roomState.positions[userId], position);
    // these actions are no-ops if call is already open or cloesd
    effects.push({
      type: shouldOpen ? 'openCall' : 'closeCall',
      peerId: roomState.users[userId].peerId,
    });
  }

  return effects;
}

/**
 * Turns a reducer into an immer produce() call. Would be unnecessary if produce
 * let us return arbitrary values, but not so bad really.
 */
function makeUpdater<T, A, E>(
  cb: (draft: Draft<T>, action: A) => E[] | E | undefined
): (state: T, action: A) => [T, E[]] {
  return (state, action) => {
    let effects: E[] = [];
    const newState = produce(state, (draft) => {
      const ret = cb(draft, action);
      if (Array.isArray(ret)) {
        effects = ret;
      } else if (typeof ret === 'object') {
        effects = [ret];
      }
    });
    return [newState, effects];
  };
}

function reducer(
  state: Draft<WorldState>,
  action: Action
): Effect[] | Effect | undefined {
  if (action.type === 'messageReceived') {
    const msg = action.msg;
    if (msg.type === 'sync') {
      state.roomState = msg;
    } else if (msg.type === 'identity') {
      state.userId = msg.userId;
    } else if (msg.type === 'joined') {
      if (!state.roomState) {
        return;
      }

      state.roomState.users[msg.userId] = msg.user;
      state.roomState.positions[msg.userId] = msg.position;
      state.log.push(`${msg.user.name} joined!`);
    } else if (msg.type === 'left') {
      const roomState = state.roomState;
      if (!roomState) {
        return;
      }

      const user = roomState.users[msg.userId];
      if (!user) {
        return;
      }

      delete roomState.users[msg.userId];
      delete roomState.positions[msg.userId];

      state.log.push(`${user.name} left!`);
    } else if (msg.type === 'move') {
      if (!state.roomState) {
        return;
      }

      state.roomState.positions[msg.userId] = msg.position;

      if (msg.userId === state.userId) {
        return updateConfirmedMove(state);
      } else {
        // we duplicate the disconnect-call check on both sides bc firefox
        // is bad and doesn't send a proper close event immediately :(
        const myPosition = state.roomState.positions[state.userId!];
        if (!inCallRadius(msg.position, myPosition)) {
          return [
            {
              type: 'closeCall',
              peerId: state.roomState.users[msg.userId].peerId,
            },
          ];
        }
      }
    }
  } else if (action.type === 'openedCall') {
    const userId = getUserIdByPeerId(state, action.peerId);
    state.openCalls.add(userId);
  } else if (action.type === 'closedCall') {
    const userId = getUserIdByPeerId(state, action.peerId);
    state.openCalls.delete(userId);
  }
}

export const updateState = makeUpdater(reducer);
