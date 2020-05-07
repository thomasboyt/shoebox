import React from 'react';
import { render } from 'react-dom';
import { App } from './components/App';

const roomCode = new URLSearchParams(window.location.search).get('room');
render(<App roomCode={roomCode} />, document.querySelector('.container'));
