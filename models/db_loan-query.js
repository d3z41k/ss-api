async function loanQuery(pool, tableName, params, mode) {
  return new Promise(async(resolve, reject) => {

    let sum = [];

    try {

      switch (mode) {

        case '1.1':

          for (let d = 0; d < params[2].length; d++) {
            sum.push([]);
            for (let dd = 0; dd < params[3].length; dd++) {

              await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                  '`Месяц` = ? ' +
                  'AND `Статья движения денег` = ? ' +
                  'AND `Займы Контрагент` = ? ' +
                  'AND `Направление группа` = ?',
                  [
                    params[0],
                    params[1][0].trim(),
                    params[2][d],
                    params[3][dd]
                  ])
                .then(([col, feilds]) => {
                  for (let key in col[0]) {
                    sum[d].push([col[0][key] ? (col[0][key] * -1): 0]);
                  }
                })
                .catch(err => {
                  console.log(err)
                });
            }
         }

         return;

       case '1.2':
         for (let d = 0; d < params[2].length; d++) {
           sum.push([]);
           for (let dd = 0; dd < params[3].length; dd++) {

             await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                 '`Месяц` = ? ' +
                 'AND `Статья движения денег` = ? ' +
                 'AND `Займы Контрагент` = ? ' +
                 'AND `Направление группа` = ?',
                 [
                   params[0],
                   params[1][1].trim(),
                   params[2][d],
                   params[3][dd]
                 ])
               .then(([col, feilds]) => {
                 for (let key in col[0]) {
                   sum[d].push([col[0][key] ? col[0][key] : 0]);
                 }
               })
               .catch(err => {
                 console.log(err)
               });
           }
        }

        return;

       case '2.1':
         for (let d = 0; d < params[2].length; d++) {
           sum.push([]);
           for (let dd = 0; dd < params[3].length; dd++) {

             await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                 '`Месяц` = ? ' +
                 'AND `Статья движения денег` = ? ' +
                 'AND `Займы Контрагент` = ? ' +
                 'AND `Направление группа` = ?',
                 [
                   params[0],
                   params[1][2].trim(),
                   params[2][d],
                   params[3][dd]
                 ])
               .then(([col, feilds]) => {
                 for (let key in col[0]) {
                   sum[d].push([col[0][key] ? col[0][key] : 0]);
                 }
               })
               .catch(err => {
                 console.log(err)
               });
           }
        }

        return;

       case '2.2':
         for (let d = 0; d < params[2].length; d++) {
           sum.push([]);
           for (let dd = 0; dd < params[3].length; dd++) {

             await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
                 '`Месяц` = ? ' +
                 'AND `Статья движения денег` = ? ' +
                 'AND `Займы Контрагент` = ? ' +
                 'AND `Направление группа` = ?',
                 [
                   params[0],
                   params[1][3].trim(),
                   params[2][d],
                   params[3][dd]
                 ])
               .then(([col, feilds]) => {
                 for (let key in col[0]) {
                   sum[d].push([col[0][key] ? (col[0][key] * -1) : 0]);
                 }
               })
               .catch(err => {
                 console.log(err)
               });
           }
        }

        return;

     }

    } catch (e) {
      reject(e.stack);
    } finally {
      resolve(sum);
    }
  });
}

module.exports = loanQuery;
