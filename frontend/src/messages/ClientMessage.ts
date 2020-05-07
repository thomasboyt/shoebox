export interface ClientMoveMessage {
  type: 'move';
  x: number;
  y: number;
}

export interface ClientChatMessage {
  type: 'chat';
  message: string;
}

export type ClientMessage = ClientMoveMessage | ClientChatMessage;
