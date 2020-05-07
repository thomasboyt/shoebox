import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';

const PositionC = t.type({
  x: t.number,
  y: t.number,
});

const UserC = t.type({
  name: t.string,
  avatar: t.string,
  peerId: t.string,
});

const SyncMessageC = t.type({
  type: t.literal('sync'),
  room: t.type({
    roomId: t.string,
    environment: t.string,
    hostId: t.string,
  }),
  positions: t.record(t.string, PositionC),
  users: t.record(t.string, UserC),
});
export type SyncMessage = t.TypeOf<typeof SyncMessageC>;

const IdentityMessageC = t.type({
  type: t.literal('identity'),
  userId: t.string,
});

const JoinedMessageC = t.type({
  type: t.literal('joined'),
  userId: t.string,
  user: UserC,
  position: PositionC,
});

const LeftMessageC = t.type({
  type: t.literal('left'),
  userId: t.string,
});

const MoveMessageC = t.type({
  type: t.literal('move'),
  userId: t.string,
  position: PositionC,
});

const ServerMessageC = t.union([
  SyncMessageC,
  IdentityMessageC,
  JoinedMessageC,
  LeftMessageC,
  MoveMessageC,
]);
export type ServerMessage = t.TypeOf<typeof ServerMessageC>;

export function parseServerMessage(data: unknown): ServerMessage | null {
  const result = ServerMessageC.decode(data);

  if (isLeft(result)) {
    const errors = PathReporter.report(result);
    console.warn('parsing errors:', errors);
    return null;
  }

  return result.right;
}
