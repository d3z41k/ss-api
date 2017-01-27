'use strict';

const config = require('config');

// Need to expand!!!

async function dbRefresh(pool, tableName, srcRows) {
  return new Promise(async(resolve, reject) => {

    await pool.query("TRUNCATE TABLE " + tableName)
      .then(() => {
        //console.log('table ' + tableName + ' truncate - OK!')
      })
      .catch(err => {
        reject(err)
      });

    for (let i = 0; i < srcRows.length; i++) {
      //-----------------------------------------------------------------------------
      // Adaptation of values "Sum"
      //-----------------------------------------------------------------------------

      srcRows[i].length = config.dds_width[2016][tableName];

      if (srcRows[i][5]) {
        if (srcRows[i][5] && srcRows[i][5][0] == '(' && srcRows[i][5][srcRows[i][5].length - 1] == ')') {
          srcRows[i][5] = srcRows[i][5].slice(1).slice(0, -1);
          srcRows[i][5] = '-' + srcRows[i][5]
        }
        srcRows[i][5] = Number(srcRows[i][5].replace(/\s/g, ''));
      }

      // if (srcRows[i][34] && srcRows[i][34].includes('→')) {
      //   srcRows[i][34] = srcRows[i][34].slice(2).trim();
      // }
      // if (srcRows[i][30] && srcRows[i][30].includes('→')) {
      //   srcRows[i][30] = srcRows[i][30].slice(2).trim();
      // }

      if (srcRows[i][24] && srcRows[i][24].includes('→')) {
        srcRows[i][24] = srcRows[i][24].slice(2).trim();
      }

      if (srcRows[i][28] && srcRows[i][28].includes('→')) {
        srcRows[i][28] = srcRows[i][28].slice(2).trim();
      }



      //------------------------------------------------------------------------------

      await pool.query("INSERT INTO " + tableName + " VALUES (NULL, '" + srcRows[i].join('\', \'') + "')")
        .catch(err => {
          reject(err)
        });

    }

    resolve('table ' + tableName + ' refreshed!');

  });
}

module.exports = dbRefresh;
