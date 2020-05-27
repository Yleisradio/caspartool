
// --------------------------------------------
// Handle Express server routes for the webapp.
// --------------------------------------------
var express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const directoryPath = path.normalize(process.env.ROOT_FOLDER);
const logger = require('../config/logger');
logger.debug('Application-route loading...');
const spx = require('../config/spx_caspartool_server_functions.js');


// ROOT ROUTES ----------------------------------------------------------------------------------------------
router.get('/', function (req, res) {
  res.render('view-home', { layout: false });
});


router.get('/contentlists', async (req, res) => {
  // show list of json datafiles
  const fileListAsJSON = await GetDataFiles();
  res.render('view-lists', { layout: false, files: fileListAsJSON.files, folder: directoryPath, errorMsg: '' });
});


router.get('/contentlists/:filename', async (req, res) => {
  // edit contents of a single json file
  let datafile = path.join(directoryPath, req.params.filename) + '.json';
  const fileDataAsJSON = await GetJsonData(datafile);
  res.render('view-edit', { layout: false, filedata: fileDataAsJSON, datafile: datafile, filebasename: req.params.filename });
});


router.post('/contentlists/', async (req, res) => {
  // add a new file and open it for editing
  const filename = req.body.filebasename + '.json';
  let datafile = path.join(directoryPath, filename);

  // check if exist
  if (fs.existsSync(datafile)) {
    //file exists
    logger.warn('File exists [' + filename + '], going back.');
    const fileListAsJSON = await GetDataFiles();
    res.render('view-lists', { layout: false, files: fileListAsJSON.files, folder: directoryPath, errorMsg: ' File exists, use another name. ' });
  }
  else {
    // 
    try {
      fs.writeFile(datafile, '', function (err) {
        if (err) {
          logger.error('ERROR creating file [' + filename + ']: ' + err);
          res.send(err);
        }
        else {
          logger.info('Created file: ' + filename);
          res.render('view-edit', { layout: false, filedata: '', filebasename: req.body.filebasename });
        }
      })
    }
    catch (err) {
      logger.error('ERROR while checking if file exists [' + datafile + ']: ' + err);
    }
  }
});




router.delete('/contentlists/:filename', async (req, res) => {
  // delete a file go to list
  let datafile = path.join(directoryPath, req.params.filename) + '.json';
  fs.unlink(datafile, function (err) {
    if (err) {
      logger.error('Error while deleting ' + datafile + ': ' + err)
      res.send(err);
    }
    else {
      logger.info('Deleted file: ' + datafile);
      const fileListAsJSON = GetDataFiles();
      res.render('view-lists', { layout: false, files: fileListAsJSON.files, folder: directoryPath });
      // this does not work?! So, let's refresh the page from client side <:-)
    }
  });
});



router.get('/caspartool/:filename', async (req, res) => {
  // edit contents of a single json file
  let datafile = path.join(directoryPath, req.params.filename) + '.json';
  const fileDataAsJSON = await GetJsonData(datafile);

  let profilefile = path.join(directoryPath, 'config', 'profiles.json');
  const profileDataJSONobj = await GetJsonData(profilefile);
  let profileData = JSON.stringify(profileDataJSONobj);
  res.render('view-controller', { layout: false, filedata: fileDataAsJSON, datafile: datafile, filebasename: req.params.filename, profiledata: profileData, profiledataObj: profileDataJSONobj });
});






// FUNCTIONS --------------------------------------------------------------------------------------------------





async function GetDataFiles() {
  // return a list of all json files in the dataroot folder
  logger.debug("Getting json files...")
  let jsonData = {};
  var key = 'files';
  jsonData.folder = directoryPath;
  jsonData[key] = [];
  let id = 0;
  try {
    fs.readdirSync(directoryPath).forEach(file => {
      let bname = path.basename(file, '.json');
      logger.debug("Getting file " + bname + "...");
      let ext = path.extname(file).toUpperCase();
      if (ext == ".JSON") {
        var stats = fs.statSync(path.join(directoryPath, file));
        var datem = moment(stats.mtime, 'DD.MM.YYYY').format();
        var filedata = {
          id: id,
          name: bname,
          date: datem
        };
        id++;
        jsonData[key].push(filedata);
      }
    });
    return jsonData;
  }
  catch (error) {
    logger.error('Failed to read folder ' + directoryPath + ': ' + error);
    return (error);
  }
} // GetDataFiles ended


async function GetJsonData(fileref) {
  // return json data from fileref
  try {
    var contents = fs.readFileSync(fileref);
    return JSON.parse(contents);
  }
  catch (error) {
    return (error);
  }
} // GetJsonData ended


// this is the last line
module.exports = router;