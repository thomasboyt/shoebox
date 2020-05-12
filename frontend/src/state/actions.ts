import { ServerMessage } from '../messages/ServerMessage';

interface MessageReceivedAction {
  type: 'messageReceived';
  msg: ServerMessage;
}
interface CallOpenedAction {
  type: 'openedCall';
  peerId: string;
}
interface CallClosedAction {
  type: 'closedCall';
  peerId: string;
}
export type Action =
  | MessageReceivedAction
  | CallOpenedAction
  | CallClosedAction;
