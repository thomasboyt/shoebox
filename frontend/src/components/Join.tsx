import React, { Component, FormEvent } from 'react';

interface Props {
  onJoin: (userName: string, stream: MediaStream) => void;
}

interface State {
  userName: string;
  stream?: MediaStream;
}

export class Join extends Component<Props, State> {
  state: State = {
    userName: '',
  };

  handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    this.props.onJoin(this.state.userName, this.state.stream!);
  };

  handleRequestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.setState({ stream });
    } catch (err) {
      alert('Error getting mic access :(');
      throw err;
    }
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <p>welcome to the party!!</p>

        <label>
          ur name
          <input
            value={this.state.userName}
            onChange={(evt) => this.setState({ userName: evt.target.value })}
          />
        </label>

        <button
          type="button"
          onClick={this.handleRequestMicAccess}
          disabled={!!this.state.stream}
        >
          {this.state.stream ? 'thanks!' : 'grant mic access'}
        </button>

        <button
          type="submit"
          disabled={this.state.userName.length === 0 || !this.state.stream}
        >
          join!
        </button>
      </form>
    );
  }
}
