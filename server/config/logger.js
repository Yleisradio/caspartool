// Import modules
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});



// logger.error("hello world!, this is error 0");
// logger.warn("hello world!, this is warn 1");
// logger.info("hello world!, this is info 2");
// logger.verbose("hello world!, this is verbose 3");
// logger.debug("hello world!, this is debug 4");
// logger.silly("hello world!, this is silly 5");


let LOGLEVEL = process.env.LOGLEVEL || 'debug';

console.log('LOGLEVEL: ' + LOGLEVEL);


const logger = createLogger({
  format: combine(
    label({ label: 'SPX Caspartool' }),
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.Console({
      level: LOGLEVEL
    }),
    new transports.File({
      level: LOGLEVEL,
      filename: `./server/log/access.log`
    })
  ]
});

// Export the logger
module.exports = logger;