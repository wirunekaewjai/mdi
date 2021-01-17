#!/usr/bin/env node
import yargs from 'yargs/yargs';
import vue from './vue';

const cli = yargs(process.argv.slice(2))
  .command('vue', 'vue mdi installer', (_) => {
    return _.option('config', {
      alias: 'c',
      describe: 'config file',
      demandOption: false,
      type: 'string',
      default: 'mdi.config.js',
    });
  })
  .help();

const { _, $0, ...args } = cli.argv;
const command = _[0];

if (command === 'vue')
{
  vue(args);
}
else
{
  cli.showHelp();
}