# shoebox

### what

shoebox is an experiment in creating a little virtual space to hang out with friends, using an uber-basic interface inspired by [the palace](https://en.wikipedia.org/wiki/The_Palace_(computer_program)). like the palace, you're represented by a little bitmap who can move around a world; unlike the palace, this is tied to a proximity-based voice chat system allowing you to join and leave ad-hoc peer-to-peer voice conversations powered by webrtc.

### connect

shoebox.disco.zone

### run in dev

start the server (localhost:4000):

```
cd server/
./gradlew run
```

start the webpack dev server, peerjs server, and tsc:

```
cd frontend/
npm install
npm start
```

go to localhost:8080

### deployment

this is a bit complicated:

* you'll want to deploy the server, probably as a docker image using the built-in jib configuration.
* then you'll want to host the host the static assets on the same host. your routing table should look like:

  ```
  /api -> $yourserverhost/api
  /ws -> $yourserverhost/ws
  /* -> static contents of dist/
  ```

* you'll need a [peerjs server](https://github.com/peers/peerjs-server) that handles webrtc signaling. you can host this somewhere or just use the [project-supplied one](https://peerjs.com/peerserver.html). this needs to get set using the `PEERJS_` env vars (see webpack.config)
