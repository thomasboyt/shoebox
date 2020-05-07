import React, { Component } from 'react';
import { produce } from 'immer';
import { parseServerMessage } from '../messages/ServerMessage';
import { World } from './World';
import { RoomState, Position } from '../models/RoomState';
import { ClientMoveMessage } from '../messages/ClientMessage';
import { CallManager } from '../CallManager';
import { Join } from './Join';

interface Props {
  roomCode: string;
}

interface State {
  didJoin: boolean;
  roomState: RoomState | null;
  userId: string | null;
  log: string[];
  openCalls: Set<string>;
}

export const CALL_MAX_RADIUS = 80;
function inCallRadius(a: Position, b: Position): boolean {
  const distance = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  console.log(a, b, distance);
  return distance < CALL_MAX_RADIUS * 2;
}

export class Room extends Component<Props, State> {
  ws?: WebSocket;
  callManager!: CallManager;

  state: Readonly<State> = {
    didJoin: false,
    roomState: null,
    openCalls: new Set(),
    userId: null,
    log: [],
  };

  handleJoin = async (userName: string, stream: MediaStream) => {
    this.callManager = new CallManager();
    this.callManager.onOpenCall = this.handleOpenCall;
    this.callManager.onCloseCall = this.handleCloseCall;
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

    if (msg.type === 'sync') {
      this.setState({ roomState: msg });
    } else if (msg.type === 'identity') {
      this.setState({ userId: msg.userId });
    } else if (msg.type === 'joined') {
      const roomState = this.state.roomState;
      if (!roomState) {
        return;
      }

      const newState = produce(roomState, (nextState) => {
        nextState.users[msg.userId] = msg.user;
        nextState.positions[msg.userId] = msg.position;
      });
      this.setState({ roomState: newState });

      this.appendLog(`${msg.user.name} joined!`);
    } else if (msg.type === 'left') {
      const roomState = this.state.roomState;
      if (!roomState) {
        return;
      }

      const user = roomState.users[msg.userId];
      if (!user) {
        return;
      }

      const newState = produce(roomState, (nextState) => {
        delete nextState.users[msg.userId];
        delete nextState.positions[msg.userId];
      });
      this.setState({ roomState: newState });

      this.appendLog(`${user.name} left!`);
    } else if (msg.type === 'move') {
      const roomState = this.state.roomState;
      if (!roomState) {
        return;
      }

      const newState = produce(roomState, (nextState) => {
        nextState.positions[msg.userId] = msg.position;
      });
      this.setState({ roomState: newState });

      if (msg.userId === this.state.userId) {
        this.updateConfirmedMove();
      } else {
        // we duplicate the disconnect-call check on both sides bc firefox
        // is bad and doesn't send a proper close event immediately :(
        const myPosition = newState.positions[this.state.userId!];
        if (!inCallRadius(msg.position, myPosition)) {
          this.callManager.closeCall(roomState.users[msg.userId].peerId);
        }
      }
    }
  };

  appendLog(message: string) {
    this.setState({
      log: produce(this.state.log, (log) => {
        log.unshift(message);
      }),
    });
  }

  // Clients are in charge of updating their current calls when they move
  updateConfirmedMove() {
    const roomState = this.state.roomState!;
    const position = roomState.positions[this.state.userId!];

    for (const userId of Object.keys(roomState.users)) {
      if (userId === this.state.userId) {
        continue;
      }

      // these calls are no-ops if call is open/closed respectively
      if (inCallRadius(roomState.positions[userId], position)) {
        this.callManager.callPeer(roomState.users[userId].peerId);
      } else {
        this.callManager.closeCall(roomState.users[userId].peerId);
      }
    }
  }

  handleRequestMove = ({ x, y }: Position) => {
    if (!this.ws) {
      return;
    }
    const msg: ClientMoveMessage = { type: 'move', x, y };
    this.ws.send(JSON.stringify(msg));
  };

  handleOpenCall = (peerId: string) => {
    const userId = this.getUserIdByPeerId(peerId);
    this.setState({
      openCalls: produce(this.state.openCalls, (openCalls) => {
        openCalls.add(userId);
      }),
    });
  };

  handleCloseCall = (peerId: string) => {
    const userId = this.getUserIdByPeerId(peerId);
    this.setState({
      openCalls: produce(this.state.openCalls, (openCalls) => {
        openCalls.delete(userId);
      }),
    });
  };

  getUserIdByPeerId(peerId: string): string {
    const userId = Object.keys(this.state.roomState!.users).find(
      (userId) => this.state.roomState!.users[userId].peerId === peerId
    );
    if (!userId) {
      throw new Error(`no user found for peer ${peerId}`);
    }
    return userId;
  }

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
          {this.state.log.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
        <h3>state</h3>
        <pre>{JSON.stringify(this.state.roomState, null, 2)}</pre>
      </div>
    );
  }
}
