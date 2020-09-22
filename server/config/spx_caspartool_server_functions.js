
// ================== functions alphabetical order  ==================================================

const logger = require('./logger.js');
const fs = require('fs');
const path = require('path')


module.exports = {


  checkServerConnections: function () {
    // require ..... nothing
    // returns ..... sends socket.io instruction to client of each CCG server in env.txt
    logger.verbose('checkServerConnections -function excecuting...');
    // SocketIO call to client
    data = { spxcmd: 'updateStatusText', status: 'Checking server connections...' };
    io.emit('SPXMessage2Client', data);

    const servers = process.env.SERVERS;
    const ServerList = servers.split('|');
    for (var i = 0; i < ServerList.length; i++) {
      logger.debug('ServerStatus ' + i + ': ' + ServerList[i]);
      let Fields = ServerList[i].split(':');
      let SrvName = Fields[0];
      let SocketIndex = this.getSockIndex(SrvName);
      logger.verbose(CCGSockets[SocketIndex]);
      data = { spxcmd: 'updateServerIndicator', indicator: 'indicator' + i, color: '#CC0000' };
      let status = {}
      status.server = i + ':' + SrvName;
      status.connecting = CCGSockets[SocketIndex].connecting;
      status.isWritable = CCGSockets[SocketIndex].writable;
      status.isReadable = CCGSockets[SocketIndex].readable;
      if (status.isWritable && status.isReadable) data.color = '#00CC00';
      // SocketIO call to client
      io.emit('SPXMessage2Client', data);
    }
  },


  CGComponentFactory: function (fieldID, value) {
    // Generate template data entry XML for CasparCG.
    // decodeURIComponent and UnSwapCharacters() added here to workaround issue #5.
    // require ..... fieldID, such as 'f0' and value such as 'Tuomo'
    // returns ..... component element as xml string, example:
    /*
    <componentData id=\"f0\">
        <data id=\"text\" value=\"Donald Trump\"/>
    </componentData>
    */

    // 22.09.2020 Fixed issue #2 (blank space sent)
    let decodedValue = decodeURIComponent(value);
    if (decodedValue) {
      return `<componentData id=\\"${fieldID}\\"><data id=\\"text\\" value=\\"${decodedValue}\\"/></componentData>`;
    }
    else
    {
      return '';
    }
    
  },




  getChannel: function (data) {
    // require ..... data as JSON object including data.profile & data.element
    // returns ..... name of the env.txt server item, such as 'TG'
    logger.debug('getChannel / ' + JSON.stringify(data));
    if (!data.profile || !data.element) {
      logger.error('ERROR - getChannel missing data! (profile: ' + data.profile + ', ' + data.element + ')! Skipping command!');
      return;
    }
    const directoryPath = path.normalize(process.env.ROOT_FOLDER);
    let profilefile = path.join(directoryPath, 'config', 'profiles.json');
    const profileDataAsJSON = this.GetJsonData(profilefile);
    var arr = profileDataAsJSON.profiles;
    let GFX_Serv = "";
    for (var i = 0; i < arr.length; i++) {
      var obj = arr[i];
      if (obj.name == data.profile) {
        logger.debug('Getting server for element [' + data.element + '].');
        if (data.element.includes("FX")) {
          // get FX server
          GFX_Serv = eval("obj.FX." + data.element + ".server");
        }
        else {
          // get template server
          GFX_Serv = eval("obj.templates." + data.element + ".server");
        }
      }
    }
    logger.verbose(data.profile + '/' + data.element + ' server = \'' + GFX_Serv + '\'.');
    return GFX_Serv;
  },


  GetJsonData: function (fileref) {
    // require ..... Full file path
    // returns ..... File contents as a JSON object
    try {
      var contents = fs.readFileSync(fileref);
      return JSON.parse(contents);
    }
    catch (error) {
      return (error);
    }
  }, // GetJsonData ended






  getSockIndex: function (SERVERNAME) {
    // Get an index of a CasparCG socket connection reference, not the object directly.
    // require .... SERVERNAME (example "TG")
    // returns .... CCG Server object INDEX (such as 0) 
    logger.debug('getSockIndex / Searching for Socket reference for connection "' + SERVERNAME + '"...');
    let serverIndex = "";
    CCGSockets.forEach(function (item, index) {
      if (global.CCGSockets[index].spxname == SERVERNAME) {
        serverIndex = index;
        logger.debug('getSockIndex found [' + global.CCGSockets[index].spxname + '] so index is [' + serverIndex + '].');
      }
      else {
        logger.debug('getSockIndex skipping ' + global.CCGSockets[index].spxname) + '...';
      }
    });
    return serverIndex;
  },


} // end of exports

