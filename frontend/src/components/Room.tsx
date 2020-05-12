import React, { Component } from 'react';
import { produce } from 'immer';
import { parseServerMessage } from '../messages/ServerMessage';
import { World } from './World';
import { Position } from '../state';
import { ClientMoveMessage } from '../messages/ClientMessage';
import { CallManager } from '../CallManager';
import { Join } from './Join';
import { updateState, WorldState, Effect, Action } from '../state';

interface Props {
  roomCode: string;
}

export class Room extends Component<Props, WorldState> {
  ws?: WebSocket;
  callManager!: CallManager;

  state: Readonly<WorldState> = {
    didJoin: false,
    roomState: null,
    openCalls: new Set(),
    userId: null,
    log: [],
  };

  handleJoin = async (userName: string, stream: MediaStream) => {
    this.callManager = new CallManager();
    this.callManager.onOpenCall = (peerId) =>
      this.updateState({ type: 'openedCall', peerId });
    this.callManager.onCloseCall = (peerId) =>
      this.updateState({ type: 'closedCall', peerId });

    await this.callManager.init(stream);

    const params = new URLSearchParams({
      room: this.props.roomCode,
      userName,
      peerId: this.callManager.peerId!,
    });

    const protocol = document.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${document.location.host}/ws?${params.toString()}`
    );
    this.ws = ws;

    ws.onmessage = this.handleMessage;
    this.setState({
      didJoin: true,
    });
  };

  handleMessage = (evt: MessageEvent) => {
    let unparsedMsg: unknown;
    try {
      unparsedMsg = JSON.parse(evt.data);
    } catch (err) {
      console.error('error parsing json message from server:', evt.data);
      return;
    }

    const msg = parseServerMessage(unparsedMsg);

    if (!msg) {
      console.error('error parsing msg', msg);
      return;
    }

    this.updateState({
      type: 'messageReceived',
      msg,
    });
  };

  handleEffect(newState: WorldState, effect: Effect) {
    if (effect.type === 'openCall') {
      this.callManager.callPeer(effect.peerId);
    } else if (effect.type === 'closeCall') {
      this.callManager.closeCall(effect.peerId);
    }
  }

  updateState(action: Action) {
    let effects: Effect[] = [];
    const newState = produce(this.state, (newState) => {
      effects = updateState(newState, action) || [];
    });

    this.setState(newState);

    for (const effect of effects) {
      this.handleEffect(newState, effect);
    }
  }

  handleRequestMove = ({ x, y }: Position) => {
    if (!this.ws) {
      return;
    }
    const msg: ClientMoveMessage = { type: 'move', x, y };
    this.ws.send(JSON.stringify(msg));
  };

  render() {
    if (!this.state.didJoin) {
      return <Join onJoin={this.handleJoin} />;
    }

    return (
      <div>
        <h3>world</h3>
        {this.state.roomState && (
          <World
            roomState={this.state.roomState}
            onRequestMove={this.handleRequestMove}
            openCalls={this.state.openCalls}
          />
        )}
        <h3>log</h3>
        <ul style={{ listStyleType: 'none', paddingLeft: '0px' }}>
          {this.state.log
            .slice()
            .reverse()
            .map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
        </ul>
        <h3>state</h3>
        <pre>{JSON.stringify(this.state.roomState, null, 2)}</pre>
      </div>
    );
  }
}
