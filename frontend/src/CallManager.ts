import Peer, { MediaConnection } from 'peerjs';

export class CallManager {
  peerId?: string;
  private stream?: MediaStream;
  private peer?: Peer;
  private audioCtx?: AudioContext;
  // tracks open calls by peer ID
  private calls = new Map<string, MediaConnection>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onOpenCall: (peerId: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onCloseCall: (peerId: string) => void = () => {};

  init(stream: MediaStream): Promise<void> {
    this.peer = new Peer({
      host: process.env.PEERJS_HOST!,
      port: parseInt(process.env.PEERJS_PORT!),
      secure: !!process.env.PEERJS_SECURE,
    });
    this.audioCtx = new AudioContext();
    this.stream = stream;

    this.peer.on('call', (call) => {
      call.answer(this.stream);
      this.handleCall(call.peer, call);
    });

    return new Promise((resolve, reject) => {
      const errListener = (err: unknown) => reject(err);
      this.peer!.on('error', errListener);

      this.peer!.on('open', (id) => {
        this.peerId = id;
        this.peer!.off('error', errListener);
        resolve();
      });
    });
  }

  callPeer(peerId: string) {
    if (this.calls.has(peerId)) {
      return;
    }
    console.log('calling', peerId);

    if (!this.peer) {
      throw Error('tried to call peer before initializing PeerMangaer');
    }
    if (!this.stream) {
      throw Error('tried to call peer before initializing media stream');
    }
    const call = this.peer.call(peerId, this.stream);
    this.handleCall(peerId, call);
  }

  closeCall(peerId: string) {
    if (!this.calls.has(peerId)) {
      return;
    }
    console.log('closing call with', peerId);
    this.calls.get(peerId)?.close();
    this.calls.delete(peerId);
  }

  private handleCall(peerId: string, call: MediaConnection) {
    this.calls.set(peerId, call);

    call.on('stream', (remoteStream) => {
      this.handleStream(peerId, remoteStream);
    });

    call.on('error', (err) => {
      console.error(err);
      this.handleClose(peerId);
    });

    call.on('close', () => {
      this.handleClose(peerId);
    });
  }

  private handleStream(peerId: string, stream: MediaStream) {
    const ctx = this.audioCtx;
    if (!ctx) {
      throw new Error('tried to handle call before setting audioCtx');
    }

    // TODO: remember which tracks are with which user so we can dispose of them later?
    const input = ctx.createMediaStreamSource(stream);
    input.connect(ctx.destination);
    this.onOpenCall(peerId);
  }

  private handleClose(peerId: string) {
    console.log('handling close from', peerId);
    this.calls.delete(peerId);
    this.onCloseCall(peerId);
  }
}
