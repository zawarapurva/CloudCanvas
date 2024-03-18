require('dotenv').config()
const express = require("express");
const { ENVIRONMENT, PORT } = process.env
const app = express();
const db = require('./models')
const logger = require('./config/logger.config')
const healthRoute = require("./routes/health.route");
const assignmentRoutes = require("./routes/assignment.route");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.info('Syntax Error: Invalid json syntax')
    res.status(400).json();
  }
});

// default route 
app.get('/', function(req, res){
  logger.info('Webapp successfully connected')
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello World\n");
});

app.use('/v2/assignments/:id', (req, res, next) => {
  if (req.method === 'PATCH') {
    logger.warn('Patch not allowed on assignment')
    res.status(405).json();
  }
  next();
});

// Register routes
app.use("/healthz",healthRoute);
app.use("/v2/assignments",assignmentRoutes);

// Catch-all for unsupported routes
app.use((req, res, next) => {
  if (req.originalUrl !== '/healthz' && req.originalUrl !== '/v2/assignments') {
    if (
      req.originalUrl.startsWith('/v2/assignments/') &&
      req.originalUrl.endsWith('/submission') &&
      req.method !== 'POST'
    ){
      // Allow only POST requests for /v2/assignments/:id/submission
      logger.warn('Invalid method for /v2/assignments/:id/submission');
      res.status(405).json();
    } else {
      logger.warn('Invalid route');
      res.status(404).json();
    }
  } else if (
    (req.originalUrl == '/v2/assignments' && 
    (req.method !== 'GET' || req.method !== 'POST' || req.method !== 'PUT' || req.method !== 'DELETE')) ||
    (req.originalUrl == '/healthz' && req.method !== 'GET')
  ) {
    logger.warn('URL is not supported');
    res.status(405).json();
  }else {
    next(); // Continue to the next middleware
  }
});

if (ENVIRONMENT !== 'TEST') {
  db.connectionTest()
  db.syncDB()
}

// set port, listen for requests
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`)
  console.log(`Server is running on port ${PORT}.`);
});