import React, { Component } from 'react';

import { Room } from './Room';

interface Props {
  roomCode: string | null;
}

export class App extends Component<Props> {
  async handleCreateRoom() {
    const resp = await fetch('/api/rooms', {
      method: 'POST',
    });

    if (resp.status !== 200) {
      alert('error creating room :(');
      console.log('hi')
      return;
    }

    const body = await resp.json();
    const roomCode = body.roomId;

    document.location.href = `/?room=${roomCode}`;
  }

  render() {
    if (this.props.roomCode) {
      return <Room roomCode={this.props.roomCode} />;
    }

    return (
      <div>
        <p>
          welcome to shoebox,
          <br />a space for hanging out with friends.
        </p>
        <button type="button" onClick={this.handleCreateRoom}>
          create a room
        </button>
      </div>
    );
  }
}
