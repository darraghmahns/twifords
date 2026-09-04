import { createLogoutHandler } from '../lib/handlers.js';
import { nodeHandler } from '../lib/node-adapter.js';

export default nodeHandler(createLogoutHandler());
