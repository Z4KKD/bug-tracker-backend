const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info', // Log level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // log the full error stack
    format.splat(),
    format.json() // Output in JSON
  ),
  transports: [
    // Log to console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // Log errors to a file
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Log all logs to a separate file
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
