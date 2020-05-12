import React, { Component, MouseEvent, createRef } from 'react';
import { RoomState, Position } from '../state';
import mallarch from '../../assets/backgrounds/mallarch.gif';
import { Avatar } from './Avatar';

interface Props {
  roomState: RoomState;
  onRequestMove: (pos: Position) => void;
  openCalls: Set<string>;
}

const WORLD_WIDTH = 512;
const WORLD_HEIGHT = 384;

export class World extends Component<Props> {
  containerRef = createRef<HTMLDivElement>();

  handleClick = (evt: MouseEvent<HTMLDivElement>) => {
    if (evt.button === 0) {
      const rect = this.containerRef.current!.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      this.props.onRequestMove({ x, y });
    }
  };

  render() {
    const { roomState, openCalls } = this.props;

    return (
      <div
        style={{
          position: 'relative',
          backgroundImage: `url(${mallarch})`,
          width: `${WORLD_WIDTH}px`,
          height: `${WORLD_HEIGHT}px`,
        }}
        onClick={this.handleClick}
        ref={this.containerRef}
      >
        {Object.keys(roomState.users).map((userId) => {
          return (
            <Avatar
              key={userId}
              user={roomState.users[userId]}
              position={roomState.positions[userId]}
              inCall={openCalls.has(userId)}
            />
          );
        })}
      </div>
    );
  }
}
