interface OpenCallEffect {
  type: 'openCall';
  peerId: string;
}
interface CloseCallEffect {
  type: 'closeCall';
  peerId: string;
}
export type Effect = OpenCallEffect | CloseCallEffect;
