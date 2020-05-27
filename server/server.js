
// Caspartool server.js for Yle
// (c) 2020 tuomo@smartpx.fi 
// https://github.com/TuomoKu


const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const exphbs = require('express-handlebars')
const app = express()
const ip = require('ip')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const rfs = require('rotating-file-stream')
app.use(express.static('server/static'))

const envload = require('dotenv').config({ path: 'env.txt' });  
if (envload.error) {
  console.log('\n\n* INIT ERROR ** Environment file \'env.txt\' missing, cannot continue. Read the docs.\n\n');
  return
}

const port = process.env.PORT || 5000;
const ipad = ip.address(); // my ip address
const logger = require('./config/logger.js');
const spx = require('./config/spx_caspartool_server_functions.js');
global.CCGSockets = [];


var logDirectory = path.join(__dirname, 'log')
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
})
app.use(morgan('combined', { stream: accessLogStream }))
const vers = process.env.npm_package_version || '(run with npm for version from package.json) ';


// Handlebars templating
app.engine('handlebars', exphbs({
  extname: '.handlebars',
  //defaultLayout: 'filelist',
  helpers: {

    // Returns IP for socket server of this app's IP address
    getSocketServerAddress: function () {
      var ip = require('ip');
      var myIP = ip.address() + ':' + port;
      return myIP;
    },

    // Language string helper
    lang(str) {
      const spxlangfile = process.env.STRINGS_FILE || 'en.json';
      var lang = require("./locales/" + spxlangfile);
      json = 'lang.' + str;
      return eval(json) || str;
    },

    // Print out version number
    ShowVersion() {
      return vers;
    },


    // Servers status check request
    ServerStatus() {
      const servers = process.env.SERVERS;
      const ServerList = servers.split('|');
      let html = "";
      for (var i = 0; i < ServerList.length; i++) {
        logger.debug('ServerStatus ' + i + ': ' + ServerList[i]);
        let Fields = ServerList[i].split(':');
        let SrvName = Fields[0];
        let SrvIPad = Fields[1];
        let SrvPort = Fields[2];
        html += '<div class="dropdown serverbtn">';
        html += '<i id="indicator' + i + '" class="fas fa-check-circle" style="color: 00CC00;"></i>&nbsp;' + SrvName;
        html += '  <div class="dropdown-content">';
        html += '  <span style="opacity: 0.4; background-color: #000;">' + SrvIPad + ':' + SrvPort + '</span><br>';
        html += '  <A href="#" OnClick="spx_system(\'CHECKCONNECTIONS\');return false;">Connection check</A><br>';
        html += '  <A href="#" OnClick="clearUsedChannels(\'' + SrvName + '\');">Clear all layers</A><br>';
        html += '</div>';
        html += '</div>';
      }
      return html;
    } // end serverstatus
  } // end helpers
})); // end app.engine

app.set('view engine', 'handlebars');
app.set('views', 'server/views/');


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


// ----> CasparCG connections are initialized in routes-caspar.js


// Router files
const ROUTEfiles = require('./routes/routes-api.js');
app.use('/api/', ROUTEfiles);

const ROUTEapp = require('./routes/routes-application.js');
app.use('/', ROUTEapp);

const ROUTEccg = require('./routes/routes-caspar.js');
app.use('/CCG', ROUTEccg);



// Showtime!
var server = app.listen(port, () => {
  console.log('');
  console.log('SPX Caspartool ... Copyright 2020 SmartPX <tuomo@smartpx.fi>');
  console.log(`Version .......... ${vers}`);
  console.log('Homepage ......... https://github.com/TuomoKu/SPX_Caspartool');
  console.log(`Locale file ...... ${process.env.STRINGS_FILE}`);
  console.log(`Dataroot ......... ${process.env.ROOT_FOLDER}`);
  console.log(`Log level ........ ${process.env.LOGLEVEL} (error, warn, info, verbose, debug)`);
  console.log(`Application ...... http://${ipad}:${port}/`);
  console.log('');
  logger.info('    *** SPX Caspartool v. ' + vers + ' STARTED (loglevel: \'' + process.env.LOGLEVEL + '\') ***');
});



// io must be declared as 'global', so routes can access it.
global.io = require('socket.io')(server);
var clients = {}
io.sockets.on('connection', function (socket) {

  logger.verbose('*** Socket connection (' + socket.id + ") Connections: " + io.engine.clientsCount);
  clients[socket.id] = socket;

  socket.on('disconnect', function () {
    console.log('*** Socket disconnected (' + socket.id + ") Connections: " + io.engine.clientsCount);
    delete clients[socket.id];
  }); // end disconnect

  socket.on('SPXMessage2Server', function (data) {
    // change colors
    logger.verbose('SPXMessage received', data)
    switch (data.spxcmd) {

      case 'command-name-here':
        // action here
        break;

      default:
        logger.warn('Unknown SPXMessage2Server command: ' + data.command);
    }
  }); // end message to server
}); // end socket-io


