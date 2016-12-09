const Crud = require('../controllers/crud');
const abc = require('./abc')();

async function getCols(auth, products, quantity, months) {
  return new Promise(async(resolve, reject) => {

    let spreadsheetId = '1bg1eC-VLZ7PYr2fw4dIscYcxKBJjl3_Blwm5p6SVEKI';
    let list = encodeURIComponent(products);
    let range = list + '!A1:1';

    let crud = new Crud(auth);
    let row = await crud.readData(spreadsheetId, range);

    let iRows = [];
    let monthCols = [];

    row[0].forEach((value, i) => {
      months.forEach((month) => {
        if (value == month) {
          iRows.push(i);
        }
      });
    });

    quantity = quantity * 3;

    iRows.forEach((iRow) => {

      var cols = {
        plan: [],
        fact: [],
      };

      for (var i = 0; i <= quantity; i++) {
        cols.plan.push(abc[iRow + i]);
        if (i != (quantity - 2)) {
          cols.fact.push(abc[iRow + (i + 1)]);
        }
        i += 2
      }

      cols.fact.pop();
      monthCols.push(cols);

    });

    resolve(monthCols)

  });
}

module.exports = getCols;
