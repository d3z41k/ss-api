async function inflowQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

    let sum = [];

    for (let d = 0; d < params[1].length; d++) {
      sum.push([]);
      for (let i = 0; i < params[3].length; i++) {
        await pool.execute('SELECT SUM(`Сумма итого руб`) FROM ' + tableName + ' WHERE ' +
            '`Месяц` = ? ' +
            'AND `Декада` = ? ' +
            'AND `Направление группа` = ? ' +
            'AND `Направление деятельноcти` = ? ' +
            'AND `Статья движения денег` = ?', [
              params[0],
              params[1][d],
              params[2],
              params[3][i],
              params[4][i]
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
    resolve(sum);
  });
}

module.exports = inflowQuery;
