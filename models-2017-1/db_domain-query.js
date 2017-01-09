async function domainQuery(pool, tableName, params) {
  return new Promise(async(resolve, reject) => {

  let values = [];

  for (let d = 0; d < params[2].length; d++) {
    values.push([]);
    for (let t = 0; t < params[3].length; t++) {
      values[d].push([]);
      for (let i = 0; i < params[0].length; i++) {
        values[d][t].push([]);

        await pool.execute('SELECT SUM(`Сумма итого руб`) FROM '+ tableName +' WHERE ' +
            '`Проекты домены и хостинги` = ? ' +
            'AND `Контрагент Домены и Хостинги` = ? ' +
            'AND `Направление деятельноcти` = ? ' +
            'AND `Статья движения денег` = ? ' +
            'AND `Месяц` = ?', [
              params[0][i],
              params[1][i],
              params[2][d],
              params[3][t],
              params[4]
            ])
          .then(([col, feilds]) => {
            for (let key in col[0]) {
              values[d][t][i].push(col[0][key] ? col[0][key] : 0);
            }
          })
          .catch(console.log);
        }
      }
    }

    resolve(values);

  });
}

module.exports = domainQuery;
