
// -------------------------------------------------------
// Handle Express server routes for the CasparCG commands.
// -------------------------------------------------------
var express = require("express");
const router = express.Router();
const path = require('path');

const logger = require('../config/logger');
logger.debug('Caspar-route loading...');
const spx = require('../config/spx_caspartool_server_functions.js');


// NOTE: functions at the end of 'server.js'



// ROUTES CCG -----------------------------------------------------------------------------------
router.get('/', function (reg, res) {
  res.send('Nothing here. Go away!');
});

router.get('/system', function (reg, res) {
  res.send('Nothing here. Get lost.');
});


router.get('/system/:data', (req, res) => {
  // same principle as with /control/:data
  // do OpSys level stuff, open folders etc..
  //
  // NOTE: This ONLY WORKS in Windows!
  // 
  data = JSON.parse(req.params.data);
  let directoryPath = "";
  logger.info('System utilities / ' + JSON.stringify(data));
  res.sendStatus(200);
  switch (data.command) {
    case 'DATAFOLDER':
      directoryPath = path.normalize(process.env.ROOT_FOLDER);
      require('child_process').exec('start "" ' + directoryPath);
      break;

    case 'TEMPLATEFOLDER':
      directoryPath = path.normalize(process.env.TEMPLATE_FOLDER_FOR_OPENCOMMAND);
      require('child_process').exec('start "" ' + directoryPath);
      break;

    case 'CHECKCONNECTIONS':
      spx.checkServerConnections();
      break;

    case 'RESTARTSERVER':
      // 
      logger.error('RESTART SERVER REQUEST RECEIVED. Will try to kill and restart using forever -utility.');
      process.exit(1);
      break;

  }
  // let profilefile = path.join(directoryPath, 'config', 'profiles.json');
});


router.get('/clearchannels/:data', (req, res) => {
  // TODO: Tämä bugittaa LAPTOP kanavan tyhjennyksen kanssa............................................................................
  // same principle as with /control/:data
  data = JSON.parse(req.params.data);
  logger.info('ClearChannels / ' + JSON.stringify(data));
  res.sendStatus(200);
  const directoryPath = path.normalize(process.env.ROOT_FOLDER);
  let profilefile = path.join(directoryPath, 'config', 'profiles.json');
  const profileDataAsJSON = spx.GetJsonData(profilefile);

  console.log(profileDataAsJSON);


  let prfName = data.profile.toUpperCase();
  let allChannels = [];
  for (var i = 0; i < profileDataAsJSON.profiles.length; i++) {
    let curName = profileDataAsJSON.profiles[i].name.toUpperCase();
    logger.verbose('ClearChannels / curName / ' + curName);
    if (curName == prfName) {
      Object.keys(profileDataAsJSON.profiles[i].templates).forEach(function (key) {
        logger.debug('ClearChannels / key / templates / ' + key);
        allChannels.push(profileDataAsJSON.profiles[i].templates[key].channel);
      });
      Object.keys(profileDataAsJSON.profiles[i].FX).forEach(function (key) {
        logger.debug('ClearChannels / key / FX / ' + key);
        allChannels.push(profileDataAsJSON.profiles[i].FX[key].channel);
      });
    }
  }
  const unique = (value, index, self) => {
    return self.indexOf(value) === index
  }
  const uniques = allChannels.filter(unique)
  uniques.forEach(item => {
    logger.verbose('ClearChannels / Clearing channel ' + item + ' on server ' + data.server);
    CCGclient = eval(data.server);
    global.CCGSockets[spx.getSockIndex(data.server)].write('CLEAR ' + item + '\r\n');
  });
});


router.get('/control/:data', (req, res) => {
  // Principle:
  // We get data object which has
  // - data.command (ADD | STOP | UPDATE)
  // - data.fields  [{ id: 'f0', value: 'Eka' }, { id: 'f1', value: 'Toka' }];
  // - data.element headline1
  // - data.profile News
  //
  // Then we read profiles-file and search for the required element
  // such as 'headline1' and get needed data from it:
  // - templatefile
  // - server
  // - channel
  // - layer
  data = JSON.parse(req.params.data);
  logger.info('CCG/Control/ ' + JSON.stringify(data));
  res.sendStatus(200);
  var DataStr = "";

  const directoryPath = path.normalize(process.env.ROOT_FOLDER);
  let profilefile = path.join(directoryPath, 'config', 'profiles.json');
  const profileDataAsJSON = spx.GetJsonData(profilefile);
  var arr = profileDataAsJSON.profiles;
  let GFX_Teml = "";
  let GFX_Serv = "";
  let GFX_Chan = "";
  let GFX_Laye = "";
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    if (obj.name == data.profile) {
      GFX_Teml = eval("obj.templates." + data.element + ".templatefile");
      GFX_Serv = eval("obj.templates." + data.element + ".server");
      GFX_Chan = eval("obj.templates." + data.element + ".channel");
      GFX_Laye = eval("obj.templates." + data.element + ".layer");
    }
  }
  logger.debug('CCG/Control - Profile ' + data.profile + "', Template: '" + GFX_Teml, "', CasparCG: " + GFX_Serv + ", " + GFX_Chan + ", " + GFX_Laye);

  if (data.command == "ADD" || data.command == "UPDATE") {
    let TEMPLATEDATA = "";
    if (data.fields) {
      data.fields.forEach(item => {
        TEMPLATEDATA += spx.CGComponentFactory(item.id, item.value)
      });
    }
    DataSta = "<templateData>";
    DataEnd = "</templateData>";
    DataStr = DataSta + TEMPLATEDATA + DataEnd;
  }

  try {
    switch (data.command) {
      case 'ADD':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' ADD 1 "' + GFX_Teml + '" 1 "' + DataStr + '"\r\n');
        break;

      case 'UPDATE':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' UPDATE 1 "' + DataStr + '"\r\n');
        break;

      case 'STOP':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' STOP 1\r\n');
        break;

      default:
        logger.warn('CCG/Control - Unknown command: ' + data.command);
    }
  } catch (error) {
    logger.error('ERROR, unable to send CCG command. Server up? ' + error)
  }


}); // control ended







router.get('/controlfx/:data', (req, res) => {
  // handle VideoFX command (overlays 1-2-3...)
  data = JSON.parse(req.params.data);
  logger.info('CCG/controlfx ' + JSON.stringify(data));
  res.sendStatus(200);
  const directoryPath = path.normalize(process.env.ROOT_FOLDER);
  let profilefile = path.join(directoryPath, 'config', 'profiles.json');
  const profileDataAsJSON = spx.GetJsonData(profilefile);
  var arr = profileDataAsJSON.profiles;
  let GFX_Serv = "";
  let GFX_Chan = "";
  let GFX_Laye = "";
  let GFX_vPla = "";
  let GFX_mPla = "";
  let GFX_mSto = "";
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    if (obj.name == data.profile) {
      logger.debug('CCG/controlfx Profile: ' + obj.name + ', Element: ' + data.element);
      GFX_Serv = eval("obj.FX." + data.element + ".server");
      GFX_Chan = eval("obj.FX." + data.element + ".channel");
      GFX_Laye = eval("obj.FX." + data.element + ".layer");
      GFX_vPla = eval("obj.FX." + data.element + ".videoplay");
      GFX_mPla = eval("obj.FX." + data.element + ".mixerplay");
      GFX_mSto = eval("obj.FX." + data.element + ".mixerstop");
      break;
    }
  }

  logger.debug("CCG/controlFX - Profile: '" + data.profile + "', CasparCG: " + GFX_Serv + ", " + GFX_Chan + ", " + GFX_Laye + ", FX-videoplay " + GFX_vPla + ", mixerplay: " + GFX_mPla + ", mixerstop: " + GFX_mSto);

  try {
    switch (data.command) {
      case 'ADD':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('PLAY ' + GFX_Chan + '-' + GFX_Laye + ' ' + GFX_vPla + '\r\n');
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('MIXER ' + GFX_Chan + '-' + GFX_Laye + ' ' + GFX_mPla + '\r\n');
        break;

      case 'STOP':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('STOP ' + GFX_Chan + '-' + GFX_Laye + '\r\n');
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('MIXER ' + GFX_Chan + '-' + GFX_Laye + ' ' + GFX_mSto + '\r\n');
        break;

      default:
        logger.warn('CCG/ControlFX - Unknown command: ' + data.command);
    }
  } catch (error) {
    logger.error('ERROR, unable to send CCG command. Server up? ' + error)
  }
}); // control ended










router.get('/controljson/:data', (req, res) => {
  data = JSON.parse(req.params.data);
  logger.info('CCG/controljson ' + JSON.stringify(data));
  res.sendStatus(200);

  const directoryPath = path.normalize(process.env.ROOT_FOLDER);
  let profilefile = path.join(directoryPath, 'config', 'profiles.json');
  const profileDataAsJSON = spx.GetJsonData(profilefile);
  var arr = profileDataAsJSON.profiles;
  let GFX_Teml = "";
  let GFX_Serv = "";
  let GFX_Chan = "";
  let GFX_Laye = "";
  let GFX_JSON = ""
  let stng = ""

  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    if (obj.name == data.profile) {
      GFX_Teml = eval("obj.templates." + data.element + ".templatefile");
      GFX_Serv = eval("obj.templates." + data.element + ".server");
      GFX_Chan = eval("obj.templates." + data.element + ".channel");
      GFX_Laye = eval("obj.templates." + data.element + ".layer");
      GFX_JSON = JSON.stringify(data.jsonData);
    }
  }

  logger.verbose("CCG/ControlJSON Profile: '" + data.profile + "', Template: '" + GFX_Teml, "', CasparCG: " + GFX_Serv + ", " + GFX_Chan + ", " + GFX_Laye)
  logger.debug('json' + JSON.stringify(GFX_JSON));
  stng = GFX_JSON;
  stng = stng.split('§backslash§').join('&bsol;'); // replace §backslash§ with html corresponding entity
  stng = stng.split('"').join('\\"'); // replace " with \"

  try {
    switch (data.command) {
      case 'ADD':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' ADD 1 "' + GFX_Teml + '" 1 "' + stng + '"\r\n');
        break;

      case 'UPDATE':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' UPDATE 1 "' + stng + '"\r\n');
        break;

      default:
        logger.warn('CCG/ControlJSON - Unknown command: ' + data.command);
    }
  } catch (error) {
    logger.error('ERROR, unable to send CCG command. Server up? ' + error)
  }
});



router.get('/testfunction', (req, res) => {
  // NOTE: Run a test function
  logger.info("PING! - a testFunction");
  res.sendStatus(200);

  console.log('Nothing here now');

});



// Create all required Socket Connections for CasparCG servers in specified in env.txt
const net = require('net')
let ServerData = [];
//let CCGSockets = [];
const ServersLst = process.env.SERVERS.split('|');
ServersLst.forEach(function (item, index) {
  CurServ = ServersLst[index];
  const CurName = CurServ.split(':')[0];
  const CurHost = CurServ.split(':')[1];
  const CurPort = CurServ.split(':')[2];
  ServerData.push({ name: CurName, host: CurHost, port: CurPort });

  // next two lines creates a dynamic variable for this loop iteration
  var CurCCG = CurName + "= undefined";
  eval(CurCCG);
  CurCCG = new net.Socket();
  global.CCGSockets.push(CurCCG); // --> PUSH Socket object to a global array for later use
  CurCCG.spxname = CurName; // give each entry a name for later searching!

  CurCCG.connect(CurPort, CurHost, function () {
    ServerData.push({ name: CurName, host: CurHost, port: CurPort });
    data = { spxcmd: 'updateServerIndicator', indicator: 'indicator' + index, color: '#00CC00' };
    io.emit('SPXMessage2Client', data);

    data = { spxcmd: 'updateStatusText', status: 'Communication established with ' + CurName + '.' };
    io.emit('SPXMessage2Client', data);

    logger.info('Caspartool connected to CasparCG as \'' + CurName + '\' at ' + CurHost + ":" + CurPort + '.');
  });

  CurCCG.on('data', function (data) {
    logger.info('Caspartool received data from CasparCG ' + CurName + ': ' + data);

    // we must parse the data so we can evaluate it...
    let CCG_RETURN_TEXT = String(data); // convert return object to string
    let CCG_RETURN_CODE = CCG_RETURN_TEXT.substring(0, 2); // first two chars
    switch (CCG_RETURN_CODE) {
      case "20":
        logger.verbose('Comms good with ' + CurName + ": " + CCG_RETURN_TEXT + '.');
        break;

      case "40":
        logger.error('Error with ' + CurName + ": " + CCG_RETURN_TEXT);
        data = { spxcmd: 'updateStatusText', status: 'Error in comms with ' + CurName + '.' };
        io.emit('SPXMessage2Client', data);
        break;

      case "50":
        logger.error('Failed ' + CurName + ": " + CCG_RETURN_TEXT);
        data = { spxcmd: 'updateStatusText', status: CurName + ' failed.' };
        io.emit('SPXMessage2Client', data);
        break;

      default:
        logger.warn('Warning ' + CurName + ": " + CCG_RETURN_TEXT);
        console.log('Unknown status value ' + CCG_RETURN_CODE);
        break;
    }


    // SocketIO call to client
    data = { spxcmd: 'updateServerIndicator', indicator: 'indicator' + index, color: '#00CC00' };
    io.emit('SPXMessage2Client', data);
    if (data.toString().endsWith('exit')) {
      CCGclient.destroy();
    }
  });

  CurCCG.on('close', function () {
    // SocketIO call to client
    data = { spxcmd: 'updateServerIndicator', indicator: 'indicator' + index, color: '#CC0000' };
    io.emit('SPXMessage2Client', data);
    data = { spxcmd: 'updateStatusText', status: 'Connection to ' + CurName + ' was closed.' };
    io.emit('SPXMessage2Client', data);
    logger.info('Caspartool connection to CasparCG \'' + CurName + '\' closed (' + CurHost + ':' + CurPort + ').');
  });

  CurCCG.on('error', function (err) {
    data = { spxcmd: 'updateServerIndicator', indicator: 'indicator' + index, color: '#CC0000' };
    io.emit('SPXMessage2Client', data);

    data = { spxcmd: 'updateStatusText', status: 'Communication error with ' + CurName + '.' };
    io.emit('SPXMessage2Client', data);

    logger.info('Caspartool socket error with CasparCG server ' + CurName + '. CasparCG running?\n', err);
  });
});


logger.debug('ServerData during init: ' + JSON.stringify(ServerData));
module.exports = router;