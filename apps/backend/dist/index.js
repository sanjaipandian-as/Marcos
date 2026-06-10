"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = __importDefault(require("./config/env.js"));
const logger_js_1 = __importDefault(require("./utils/logger.js"));
const socket_handler_js_1 = require("./socket/socket.handler.js");
const jobs_worker_js_1 = require("./queues/jobs.worker.js");
const server = http_1.default.createServer(app_js_1.default);
// 1. Initialize Real-Time WebSockets
(0, socket_handler_js_1.initSocket)(server);
// 2. Initialize Background Task Workers
(0, jobs_worker_js_1.initWorker)();
const port = env_js_1.default.PORT;
server.listen(port, () => {
    logger_js_1.default.info(`🚀 MARCOS Backend Engine running in ${env_js_1.default.NODE_ENV} mode on port ${port}`);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_js_1.default.error('Unhandled Rejection at Promise', { metadata: { reason, promise } });
});
process.on('uncaughtException', (error) => {
    logger_js_1.default.error('Uncaught Exception thrown', { metadata: { error: error.message, stack: error.stack } });
    process.exit(1);
});
// Trigger nodemon reload (Port cleared and restarted).
