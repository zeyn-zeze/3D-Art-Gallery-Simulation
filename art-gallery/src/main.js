import './style.css';
import './ui/styles.css';

import { initApp } from './app/init.js';
import { startLoop } from './app/loop.js';

const app = initApp();
startLoop(app);
