/* eslint-disable no-console */
import DriverCommand from './driver-command';
import PluginCommand from './plugin-command';
import {DRIVER_TYPE, PLUGIN_TYPE} from '../constants';
import {errAndQuit, JSON_SPACES} from './utils';

export const commandClasses = Object.freeze(
  /** @type {const} */ ({
    [DRIVER_TYPE]: DriverCommand,
    [PLUGIN_TYPE]: PluginCommand,
  })
);

/**
 * Run a subcommand of the 'appium driver' type. Each subcommand has its own set of arguments which
 * can be represented as a JS object.
 *
 * @param {Object} args - JS object where the key is the parameter name (as defined in
 * driver-parser.js)
 * @template {import('../extension/manifest').ExtensionType} ExtType
 * @param {import('../extension/extension-config').ExtensionConfig<ExtType>} config - Extension config object
 */
async function runExtensionCommand(args, config) {
  // TODO driver config file should be locked while any of these commands are
  // running to prevent weird situations
  let jsonResult = null;
  const {extensionType: type} = config;
  const extCmd = args[`${type}Command`];
  if (!extCmd) {
    throw new TypeError(`Cannot call ${type} command without a subcommand like 'install'`);
  }
  let {json, suppressOutput} = args;
  if (suppressOutput) {
    json = true;
  }
  const CommandClass = /** @type {ExtCommand<ExtType>} */ (commandClasses[type]);
  const cmd = new CommandClass({config, json});
  try {
    jsonResult = await cmd.execute(args);
  } catch (err) {
    // in the suppress output case, we are calling this function internally and should
    // just throw instead of printing an error and ending the process
    if (suppressOutput) {
      throw err;
    }
    errAndQuit(json, err);
  }

  if (json && !suppressOutput) {
    console.log(JSON.stringify(jsonResult, null, JSON_SPACES));
  }

  return jsonResult;
}

export {runExtensionCommand};

/**
 * @template {import('@appium/types').ExtensionType} ExtType
 * @typedef {ExtType extends import('@appium/types').DriverType ? import('@appium/types').Class<DriverCommand> : ExtType extends import('@appium/types').PluginType ? import('@appium/types').Class<PluginCommand> : never} ExtCommand
 */
