const express = require('express');
const path = require('path');
const debuglog = require('logkitx');

const app = express();
const serverPort = 3001;

const logger = require('pino')({level: process.env.LEVEL || 'info'}, process.stderr);
debuglog(logger, {
  levels: ['info', 'debug', 'warn', 'trace', 'error', 'fatal'],
  format: 'logfmt'
});

// Serve static files from the client folder
app.use(express.static(path.join(__dirname, '../client')));

// Start the server
app.listen(serverPort, () => {
  console.log(`Server running on port ${serverPort}`);
});
