function normalizeMinus(number) {
   if (number && typeof(number) === 'string') {
     number = number.trim();
     if (number[0] == '(' && number[number.length - 1] == ')') {
       number = number.slice(1).slice(0, -1);
       number = '-' + number;
       number = Number(number.replace(/\s/g, ''));
     } else if (number == '-') {
       number = 0;
     } else {
       number = Number(number.replace(/\s/g, ''));
     }
   }
   return number;
}
module.exports = normalizeMinus;
