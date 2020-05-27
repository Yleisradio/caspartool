
// -----------------------------------------
// Handle Express server routes for the API.
// -----------------------------------------
var express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const directoryPath = path.normalize(process.env.ROOT_FOLDER);
const logger = require('../config/logger');
logger.debug('API-route loading...');
const spx = require('../config/spx_caspartool_server_functions.js');

// ROUTES -------------------------------------------------------------------------------------------
router.get('/', function (reg, res) {
  res.send('Nothing here. Go away!');
});

router.get('/files', async (reg, res) => {
  // Get files
  const fileListAsJSON = await GetDataFiles();
  res.send(fileListAsJSON);
}); // files route ended


router.post('/savefile/:filebasename', async (req, res) => {
  // save data to the file
  let datafile = path.join(directoryPath, req.params.filebasename) + '.json';
  logger.debug('Saving file ' + datafile + '...');
  let data = req.body;
  data.updated = new Date().toISOString();
  let filedata = JSON.stringify(req.body, null, 2);
  fs.writeFile(datafile, filedata, (err) => {
    if (err) {
      logger.error('Error while saving ' + datafile + ': ' + err);
      throw err;
    }
    logger.info('Updated file ' + datafile);
  });
});





// FUNCTIONS -------------------------------------------------------------------------------------------
async function GetDataFiles() {
  // Get files
  // const directoryPath = path.normalize("X:/01_Projects/Yle/CasparTool_project_2020/DEV/DATA_FOLDER/");
  const directoryPath = path.normalize(process.env.ROOT_FOLDER);
  let jsonData = {};
  var key = 'files';
  jsonData.folder = directoryPath;
  jsonData[key] = [];
  let id = 0;

  try {
    fs.readdirSync(directoryPath).forEach(file => {
      let ext = path.extname(file).toUpperCase();
      if (ext == ".JSON") {
        var stats = fs.statSync(path.join(directoryPath, file));
        var datem = moment(stats.mtime, 'DD.MM.YYYY').format();
        var filedata = {
          id: id,
          name: file,
          date: datem
        };
        id++;
        jsonData[key].push(filedata);
      }
    });
    return jsonData;
  }
  catch (error) {
    logger.error('Error while reading files from ' + directoryPath + ': ' + err);
    return (error);
  }
} // GetDataFiles ended


module.exports = router;