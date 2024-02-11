const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/error');
const userRouter = require('./routes/user');
const espRouter = require('./routes/esp');
const { updateDb } = require('./controllers/special');
// eslint-disable-next-line import/order
const WebSocketClient = require('websocket').client;

const client = new WebSocketClient();

client.on('connectFailed', (error) => {
  console.log(`Connect Error: ${error.toString()}`);
  console.log('Reconnecting to websocket...');
  client.connect('wss://smart-sw.onrender.com/ws/nodemcuadmin');
});

client.on('connect', (connection) => {
  console.log('WebSocket Client Connected');
  connection.on('error', (error) => {
    console.log(`Connection Error: ${error.toString()}`);
  });
  connection.on('close', () => {
    console.log('Connection Closed');
    console.log('Reconnecting to websocket...');
    client.connect('wss://smart-sw.onrender.com/ws/nodemcuadmin');
  });
  connection.on('message', (message) => {
    let data = null;
    // console.log(message.type);
    if (message.type === 'utf8') {
      data = message.utf8Data.toLowerCase();
      console.log(`Received: '${data}'`);
      updateDb(data).then(() => {
        console.log('Updated');
      });
      // query = data.split(':')[0];
      // data = data.split(':')[1];
      // if (query === 'verify') {
      //   verifyUser(data).then((res) => {
      //     console.log(res);
      //     connection.sendUTF(res);
      //   });
      // }
    }
  });
});

client.connect('wss://smart-sw.onrender.com/ws/nodemcuadmin');

const app = express();

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json());

// Serving static file
app.use(express.static(`${__dirname}/public`));

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/esp', espRouter);
app.use('/', (req, res, next) => {
  res.json({
    status: 'Active',
    message: 'Server Running',
  });
});

// Error Handling
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
