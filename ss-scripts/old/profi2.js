'use strict';

const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

//-------------------------------------------------------------------------
// Usres libs
//-------------------------------------------------------------------------

const formatDate = require('../libs/format-date');

//-------------------------------------------------------------------------

async function profi2(mon) {
  return new Promise(async(resolve, reject) => {
    // Load client secrets from a local file.

    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }

      // Authorize a client with the loaded credentials, then call the
      // Google Sheets API.

      authorize(JSON.parse(content), start);
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */


    function authorize(credentials, callback) {

      var clientSecret = credentials.installed.client_secret;
      var clientId = credentials.installed.client_id;
      var redirectUrl = credentials.installed.redirect_uris[0];
      var auth = new googleAuth();
      var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

      // Check if we have previously stored a token.

      fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
          getNewToken(oauth2Client, callback);
        } else {
          oauth2Client.credentials = JSON.parse(token);
          callback(oauth2Client);
        }
      });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback to call with the authorized
     *     client.
     */
    function getNewToken(oauth2Client, callback) {
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      });
      console.log('Authorize this app by visiting this url: ', authUrl);
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
          if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
          }
          oauth2Client.credentials = token;
          storeToken(token);
          callback(oauth2Client);
        });
      });
    }

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */

    function storeToken(token) {
      try {
        fs.mkdirSync(TOKEN_DIR);
      } catch (err) {
        if (err.code != 'EEXIST') {
          throw err;
        }
      }
      fs.writeFile(TOKEN_PATH, JSON.stringify(token));
      console.log('Token stored to ' + TOKEN_PATH);
    }

    /**
     * Google spreadsheets formula:
     *
     */

//-------------------------------------------------------------

    async function readData(auth, spreadsheetId, range) {
      return new Promise(async (resolve, reject) => {

        let sheets = google.sheets('v4');

        sheets.spreadsheets.values.get({
          auth: auth,
          spreadsheetId: spreadsheetId,
          range: range
        }, (err, response) => {
          if (err) {
            console.log('The API returned an error: ' + err);
            reject(err);
          }

          resolve(response.values);

          //console.log(response.values);

        });

      });
    }

    async function handlerParams1(rows, params) {
      return new Promise(async (resolve, reject) => {

        if (rows.length == 0) {
          console.log('No data found.');
        } else {

          params[0].push(rows[1][0]);
          params[1].push(rows[2][0]);
          params[2].push(rows[0][0]);

          resolve(params);
        }

      });
    }

    async function handlerParams2(rows, params) {
      return new Promise(async (resolve, reject) => {

        if (rows.length == 0) {
          console.log('No data found.');
        } else {

          for (let i = 0; i < rows.length; i++) {
            let row = rows[i];

            params[3].push(row[0]);
            params[4].push(row[1]);
            params[5].push(row[4]);

          }
        }

        resolve(params);
      });
    }

    async function handlerDDS(rows) {
      return new Promise(async (resolve, reject) => {

        let ddsData = [[], [], [], [], [], [], []];


        if (rows.length == 0) {
          console.log('No data found.');
        } else {

          for (let i = 0; i < rows.length; i++) {
            let row = rows[i];

            ddsData[0].push(row[8]);
            ddsData[1].push(row[9]);
            ddsData[2].push(row[1]);
            ddsData[3].push(row[11]);
            ddsData[4].push(row[12]);
            ddsData[5].push(row[13]);
            ddsData[6].push(row[5]);

          }
        }

        resolve(ddsData);

      });
    }

    async function myQuery(ddsData, params) {
      return new Promise(async (resolve, reject) => {

        let sum = [];


        for (let i = 0; i < params[3].length; i++) {

          let n = 0;

          for (let j = 0; j < ddsData[0].length; j++) {


            if (ddsData[0][j] == params[0][0]
              && ddsData[1][j] == params[1][0]
              && ddsData[2][j] == params[2][0]
              && ddsData[3][j] == params[3][i]
              && ddsData[4][j] == params[4][i]
              && ddsData[5][j] == params[5][i]) {

              n += Number(ddsData[6][j].replace( /\s/g, '' ));

            }

          }

          sum.push([n]);

        }

        resolve(sum);
      });

    }

    async function updateData(auth, data, spreadsheetId, range) {
      return new Promise(async (resolve, reject) => {

        let sheets = google.sheets('v4');

        sheets.spreadsheets.values.update({
          auth: auth,
          spreadsheetId: spreadsheetId,
          range: range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: data
          }
        }, (err) => {
          if (err) {
            console.log('The API returned an error: ' + err);
            reject(err);
          }

          resolve('update - OK!');

        });

      });
    }

    //-------------------------------------------------------------

    let months = {
      'Jul': ['AA', 'AB', 'AC'],
      'Aug': ['AP', 'AQ'],
      'Sep': ['BE', 'BF'],
      'Oct': ['BU', 'BV', 'BW'],
      'Nov': ['CK', 'CL', 'CM'],
      'Dec': ['DA', 'DB', 'DC']
    };

    var nowMonths  = {};
    var mode = 0;


    if (arguments.length) {
      nowMonths[mon[0]] = months[mon[0]];
      nowMonths[mon[1]] = months[mon[1]];
      months =  nowMonths;
      mode = 1;
    }

    //-------------------------------------------------------------


    async function start(auth) {

      let directions = ['Кузов', 'Автостекла', 'Автоэлектрика', 'Подвеска', 'Татуаж', 'Эвакуатор', 'Тонировка'];
      //let directions = ['Кузов'];

      //-------------------------------------------------------------
      // Read data from DDS to RAM & combine data arrays
      //-------------------------------------------------------------

      let spreadsheetId = '1AxHOwz7zVZ6j6ulTKx7_XqVmKLDSwNf5Y2PqRrurQak';
      let list = encodeURIComponent('ДДС_Лера');
      let range = list + '!A6:N';

      let srcRows = await readData(auth, spreadsheetId, range);

      let ddsData = await handlerDDS(srcRows);

      //-------------------------------------------------------------
      // Read data from Profi to RAM & combine params arrays (2 steps)
      //
      //
      //
      //-------------------------------------------------------------

      spreadsheetId = '1V0vQTOSsMvqZ-VeY1sgRYMVXnvWyLESt5Wc1stYjKGQ';

      for (let month in months) {

        for (let m = 0; m < directions.length; m++){

          list = encodeURIComponent(directions[m]);

          for (let i = 0; i < months[month].length; i++) {

            range = list + '!' + months[month][i] + '2:' + months[month][i] + '4';

            let dstRows = await readData(auth, spreadsheetId, range);

            let params = [[], [], [], [], [], []];
            params = await handlerParams1(dstRows, params);

            range = list + '!C7:G';
            dstRows = await readData(auth, spreadsheetId, range);

            params = await handlerParams2(dstRows, params);

            let filalData = await myQuery(ddsData, params);

            range = list + '!' + months[month][i] + '7:' + months[month][i];
            await updateData(auth, filalData ,spreadsheetId, range).then((result) => {console.log(result)});

          }

        }

      }

      //-------------------------------------------------------------
      // Update date-time in "Monitoring"
      //-------------------------------------------------------------

      let logSpreadsheetId = '1BWIgoCKT98IoYo8QJYas3BICqcFsOpePOcH19XMCD90';

      if (mode) {
        range = 'sheet1!C4';
      } else {
        range = 'sheet1!B4';
      }

      let now = new Date();
      now = [[formatDate(now)]];

      //console.log(now);

      await updateData(auth, now, logSpreadsheetId, range);

      //resolve('complite!');

    }

    //crutch for avoid timeout
    resolve('complite!');

  });
}

module.exports = profi2;