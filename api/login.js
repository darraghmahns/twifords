import { createLoginHandler } from '../lib/handlers.js';
import { nodeHandler } from '../lib/node-adapter.js';

export default nodeHandler(createLoginHandler());
