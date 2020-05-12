import React, { Component, CSSProperties, SyntheticEvent } from 'react';
import { User, Position, CALL_MAX_RADIUS } from '../state';
import defaultAvatar from '../../assets/defaultAvatar.png';

interface Props {
  user: User;
  position: Position;
  inCall: boolean;
}

interface State {
  imgWidth: number;
  imgHeight: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAvatar = (avatar: string): string => {
  // TODO
  return defaultAvatar;
};

export class Avatar extends Component<Props, State> {
  state: State = {
    imgWidth: 0,
    imgHeight: 0,
  };

  handleImgLoad = (evt: SyntheticEvent<HTMLImageElement>) => {
    this.setState({
      imgWidth: evt.currentTarget.width,
      imgHeight: evt.currentTarget.height,
    });
  };

  render() {
    const { user, position, inCall } = this.props;

    const halfWidth = this.state.imgWidth / 2;
    const halfHeight = this.state.imgHeight / 2;
    const leftX = position.x - halfWidth;
    const topY = position.y - halfHeight;

    // TODO: translate position for scaling here
    const style: CSSProperties = {
      position: 'absolute',
      left: `${leftX}px`,
      top: `${topY}px`,
      zIndex: 2,
    };

    const labelStyle: CSSProperties = {
      fontSize: '12px',
      color: 'white',
      backgroundColor: 'rgba(0, 0, 0, .5)',
      padding: '2px 4px',
      zIndex: 2,

      // center align:
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap',
    };

    const callRadiusStyle: CSSProperties = {
      position: 'absolute',
      left: `${halfWidth - CALL_MAX_RADIUS}px`,
      top: `${halfHeight - CALL_MAX_RADIUS}px`,
      zIndex: 1,
    };

    return (
      <div style={style}>
        <img src={getAvatar(user.avatar)} onLoad={this.handleImgLoad} />

        <div style={labelStyle}>{user.name}</div>

        <svg
          style={callRadiusStyle}
          width={CALL_MAX_RADIUS * 2}
          height={CALL_MAX_RADIUS * 2}
        >
          <circle
            cx={CALL_MAX_RADIUS}
            cy={CALL_MAX_RADIUS}
            r={CALL_MAX_RADIUS}
            strokeWidth={2}
            stroke={inCall ? 'limegreen' : 'red'}
            fill="transparent"
          />
        </svg>
      </div>
    );
  }
}
