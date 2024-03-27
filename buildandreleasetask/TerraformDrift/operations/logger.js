const chalk = require('chalk');

function customLog(logPrint) {
    console.log(chalk.yellow(logPrint));
}

module.exports = customLog;