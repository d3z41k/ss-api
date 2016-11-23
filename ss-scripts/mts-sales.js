const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

async function mts() {
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
      //authorize(JSON.parse(content), updateData);
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
      fs.readFile(TOKEN_PATH, function (err, token) {
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
      rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
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
     * =IFERROR(QUERY(IMPORTRANGE("1AxHOwz7zVZ6j6ulTKx7_XqVmKLDSwNf5Y2PqRrurQak";
     *"ДДС_Ольга!A5:AM1500");"select sum(Col6) where Col36 = """&$A8&""" and Col37 = """&$B8&""" and
     *Col10 = """&$K$4&""" and Col34 = ""Новая"" and Col9 = """&$C8&""" label sum(Col6) ''");0)
     */


    async function readData(auth, spreadsheetId, range) {
      return new Promise(async(resolve, reject) => {

        let sheets = google.sheets('v4');

        sheets.spreadsheets.values.get({
          auth: auth,
          spreadsheetId: spreadsheetId,
          range: range
        }, (err, response) => {
          if (err) {
            console.log('The API returned an error: ' + err);
          }

          resolve(response.values);

          //console.log(response.values);

        });

      });
    }

    async function handlerParams(rows) {
      return new Promise(async(resolve, reject) => {

        let params = [
          [],
          [],
          [],
          ['Новая'],
          []

        ];


        if (rows.length == 0) {
          console.log('No data found.');
        } else {

          params[2].push(rows[3][10]);

          for (let i = 6; i < rows.length; i++) {
            let row = rows[i];

            params[0].push(row[0]);
            params[1].push(row[1]);
            params[4].push(row[2]);

          }
        }

        resolve(params);

      });
    }

    async function handlerDDS(rows) {
      return new Promise(async(resolve, reject) => {

        let ddsData = [[], [], [], [], [], [], []];


        if (rows.length == 0) {
          console.log('No data found.');
        } else {

          for (let i = 0; i < rows.length; i++) {
            let row = rows[i];

            ddsData[0].push(row[35]);
            ddsData[1].push(row[36]);
            ddsData[2].push(row[9]);
            ddsData[3].push(row[33]);
            ddsData[4].push(row[8]);
            ddsData[5].push(row[5]);
            ddsData[6].push(row[0]);

          }
        }

        resolve(ddsData);

      });
    }

    async function myQuery(ddsData, params) {
      return new Promise(async(resolve, reject) => {

        let sum = [];
        let dates = [];

        for (let i = 0; i < params[0].length; i++) {

          let n = 0;
          let date = '';

          for (let j = 0; j < ddsData[0].length; j++) {

            if (ddsData[0][j] == params[0][i]
              && ddsData[1][j] == params[1][i]
              && ddsData[2][j] == params[2]
              && ddsData[3][j] == params[3]
              && ddsData[4][j] == params[4][i]) {

              date = ddsData[6][j];
              n += Number(ddsData[5][j].replace(/\s/g, ''));

            }

          }

          sum.push([n]);
          dates.push([date]);

        }

        resolve({sum: sum, dates: dates});
      });

    }

    async function updateData(auth, data, spreadsheetId, range) {
      return new Promise(async(resolve, reject) => {

        let sheets = google.sheets('v4');
        let list = encodeURIComponent('test');

        sheets.spreadsheets.values.update({
          auth: auth,
          spreadsheetId: spreadsheetId,
          range: range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: data
          },

        }, (err, response) => {
          if (err) {
            console.log('The API returned an error: ' + err);
          }

          resolve('update - OK!');

        });

      });
    }


    async function start(auth) {

      let spreadsheetId = '1AxHOwz7zVZ6j6ulTKx7_XqVmKLDSwNf5Y2PqRrurQak';
      let list = encodeURIComponent('ДДС_Ольга');
      let range = list + '!A5:AM1500';

      let srcRows = await readData(auth, spreadsheetId, range);

      let ddsData = await handlerDDS(srcRows);

      spreadsheetId = '1pnHFRH_7yaoZxKVA4wlK-67vP4Qxz1eSuKLTvXaRavk';
      list = encodeURIComponent('Продажи');
      range = list + '!A1:K85';

      let dstRows = await readData(auth, spreadsheetId, range);

      let params = await handlerParams(dstRows);

      let filalData = await myQuery(ddsData, params);

      range = list + '!K7:K';
      await updateData(auth, filalData.sum, spreadsheetId, range);

      range = list + '!L7:L';
      await updateData(auth, filalData.dates, spreadsheetId, range);

      let logSpreadsheetId = '1BWIgoCKT98IoYo8QJYas3BICqcFsOpePOcH19XMCD90';
      range = 'sheet1!B2';
      let now = new Date();
      let options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };

      now = [[now.toLocaleString('ru-RU', options)]];

      await updateData(auth, now, logSpreadsheetId, range);

      resolve('complite!');

    }

  });
}

module.exports = mts;
