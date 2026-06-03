const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
async function run() {
  try {
    const res = await yahooFinance.quote('AAPL');
    console.log(res.shortName);
  } catch (err) {
    console.error(err);
  }
}
run();
