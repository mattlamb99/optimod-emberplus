/**
 * bridge.js
 *
 * This file creates an EmberPlus server that exposes an Ember tree representing
 * an Orban Optimod device. The tree contains three subtrees:
 *
 *   • Device Info – with parameters for Software Version and Station Name.
 *   • Monitoring – with parameters for various input and power statuses.
 *   • Status – with parameters showing the connection state and the timestamp of the last successful SNMP poll.
 *
 * The service polls the Optimod via SNMP (using net-snmp) at a configurable interval
 * and updates the corresponding EmberPlus tree nodes.
 *
 * Environment variables (or defaults) used:
 *   - OPTIMOD_ADDRESS (e.g. "192.168.1.100")
 *   - SNMP_COMMUNITY (default "public")
 *   - POLL_INTERVAL_MS (default 5000 ms)
 *   - EMBERPLUS_PORT (default 9000)
 */

const chalk = require('chalk').default;
const snmp = require('net-snmp');
require('dotenv').config();

const { EmberServer, Model } = require('emberplus-connection');
const {
  NumberedTreeNodeImpl,
  EmberNodeImpl,
  ParameterImpl,
  ParameterType,
  ParameterAccess
} = Model;

// -------------------------------------------------
// 1. Environment & SNMP Settings
// -------------------------------------------------
const OPTIMOD_ADDRESS = process.env.OPTIMOD_ADDRESS || '192.168.1.100';
const SNMP_COMMUNITY = process.env.SNMP_COMMUNITY || 'public';
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS) || 5000;
const EMBERPLUS_PORT = parseInt(process.env.EMBERPLUS_PORT) || 9000;

// Numeric OIDs from the Optimod MIB.
// (Adjust these if your MIB requires different numeric values)
const oids = {
  softwareVersion: '1.3.6.1.4.1.41877.5.1.1',
  stationName: '1.3.6.1.4.1.41877.5.1.2',
  inputAnalog: '1.3.6.1.4.1.41877.5.3.1',
  inputDigital: '1.3.6.1.4.1.41877.5.3.2',
  analogInputSilent: '1.3.6.1.4.1.41877.5.3.3',
  aesInputSilent: '1.3.6.1.4.1.41877.5.3.4',
  aesInputError: '1.3.6.1.4.1.41877.5.3.5',
  powerSupply1Status: '1.3.6.1.4.1.41877.5.3.6',
  powerSupply2Status: '1.3.6.1.4.1.41877.5.3.7'
};

// Create an SNMP session to the Optimod.
const session = snmp.createSession(OPTIMOD_ADDRESS, SNMP_COMMUNITY);

// -------------------------------------------------
// 2. Build the EmberPlus Tree
// -------------------------------------------------
// -- Device Info parameters (strings) --
const softwareVersionParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.String, 'Software Version', 'Firmware version', '', undefined, undefined, ParameterAccess.Read)
);
const stationNameParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.String, 'Station Name', 'Station name', '', undefined, undefined, ParameterAccess.Read)
);

// -- Monitoring parameters (booleans) --
const inputAnalogParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'Input Analog', 'Analog Input active status', false, undefined, undefined, ParameterAccess.Read)
);
const inputDigitalParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'Input Digital', 'Digital Input active status', false, undefined, undefined, ParameterAccess.Read)
);
const analogInputSilentParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'Analog Input Silent', 'Analog input silent status', false, undefined, undefined, ParameterAccess.Read)
);
const aesInputSilentParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'AES Input Silent', 'AES input silent status', false, undefined, undefined, ParameterAccess.Read)
);
const aesInputErrorParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'AES Input Error', 'AES input error status', false, undefined, undefined, ParameterAccess.Read)
);
const powerSupply1StatusParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'Power Supply 1', 'Power Supply 1 status', false, undefined, undefined, ParameterAccess.Read)
);
const powerSupply2StatusParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'Power Supply 2', 'Power Supply 2 status', false, undefined, undefined, ParameterAccess.Read)
);

// -- Status parameters --
// "Optimod Connected" indicates if the last poll was successful.
// "Last Poll" contains an ISO timestamp of the last successful poll.
const connectedParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.Boolean, 'Optimod Connected', 'Indicates if the Optimod device is reachable via SNMP', false, undefined, undefined, ParameterAccess.Read)
);
const lastPollParameterNode = new NumberedTreeNodeImpl(
  1,
  new ParameterImpl(ParameterType.String, 'Last Poll', 'Timestamp of the last successful SNMP poll', '', undefined, undefined, ParameterAccess.Read)
);

// -------------------------------------------------
// Build Subtrees
// -------------------------------------------------
// Device Info subtree.
const deviceInfoSubtree = {
  1: new NumberedTreeNodeImpl(
    1,
    new EmberNodeImpl('Software Version', 'Firmware version', undefined, true),
    { 1: softwareVersionParameterNode }
  ),
  2: new NumberedTreeNodeImpl(
    2,
    new EmberNodeImpl('Station Name', 'Station name', undefined, true),
    { 1: stationNameParameterNode }
  )
};

// Monitoring subtree.
const monitoringSubtree = {
  1: new NumberedTreeNodeImpl(
    1,
    new EmberNodeImpl('Input Analog', 'Analog Input active status', undefined, true),
    { 1: inputAnalogParameterNode }
  ),
  2: new NumberedTreeNodeImpl(
    2,
    new EmberNodeImpl('Input Digital', 'Digital Input active status', undefined, true),
    { 1: inputDigitalParameterNode }
  ),
  3: new NumberedTreeNodeImpl(
    3,
    new EmberNodeImpl('Analog Input Silent', 'Analog input silent status', undefined, true),
    { 1: analogInputSilentParameterNode }
  ),
  4: new NumberedTreeNodeImpl(
    4,
    new EmberNodeImpl('AES Input Silent', 'AES input silent status', undefined, true),
    { 1: aesInputSilentParameterNode }
  ),
  5: new NumberedTreeNodeImpl(
    5,
    new EmberNodeImpl('AES Input Error', 'AES input error status', undefined, true),
    { 1: aesInputErrorParameterNode }
  ),
  6: new NumberedTreeNodeImpl(
    6,
    new EmberNodeImpl('Power Supply 1', 'Power Supply 1 status', undefined, true),
    { 1: powerSupply1StatusParameterNode }
  ),
  7: new NumberedTreeNodeImpl(
    7,
    new EmberNodeImpl('Power Supply 2', 'Power Supply 2 status', undefined, true),
    { 1: powerSupply2StatusParameterNode }
  )
};

// Status subtree.
const statusSubtree = {
  1: new NumberedTreeNodeImpl(
    1,
    new EmberNodeImpl('Connected', 'Optimod connection status', undefined, true),
    { 1: connectedParameterNode }
  ),
  2: new NumberedTreeNodeImpl(
    2,
    new EmberNodeImpl('Last Poll', 'Timestamp of last successful SNMP poll', undefined, true),
    { 1: lastPollParameterNode }
  )
};

// Build the complete tree with a top-level "Optimod" node.
const tree = {
  1: new NumberedTreeNodeImpl(
    1,
    new EmberNodeImpl('Optimod', 'Orban Optimod SNMP to EmberPlus Gateway', undefined, true),
    {
      1: new NumberedTreeNodeImpl(
        1,
        new EmberNodeImpl('Device Info', 'Device Information', undefined, true),
        deviceInfoSubtree
      ),
      2: new NumberedTreeNodeImpl(
        2,
        new EmberNodeImpl('Monitoring', 'Monitoring Parameters', undefined, true),
        monitoringSubtree
      ),
      3: new NumberedTreeNodeImpl(
        3,
        new EmberNodeImpl('Status', 'Connection status', undefined, true),
        statusSubtree
      )
    }
  )
};

// -------------------------------------------------
// 3. Start the EmberPlus Server
// -------------------------------------------------
const server = new EmberServer(EMBERPLUS_PORT);
server.init(tree);
console.log(chalk.blue(`EmberPlus server running on port ${EMBERPLUS_PORT}`));

// -------------------------------------------------
// 4. SNMP Polling to Update the Tree
// -------------------------------------------------
/**
 * pollOptimod polls the Optimod SNMP agent for defined OIDs and updates
 * the corresponding EmberPlus tree nodes.
 */
function pollOptimod() {
  // Get all OID values at once.
  const oidList = Object.values(oids);
  session.get(oidList, (error, varbinds) => {
    if (error) {
      console.error(chalk.red('SNMP GET error:'), error);
      // Mark device as disconnected if there is an error.
      server.update(connectedParameterNode, { value: false });
      return;
    }
    // Mark device as connected and update the last poll timestamp.
    server.update(connectedParameterNode, { value: true });
    server.update(lastPollParameterNode, { value: new Date().toISOString() });

    // The order of varbinds corresponds to Object.values(oids).
    const keys = Object.keys(oids);
    keys.forEach((key, index) => {
      if (snmp.isVarbindError(varbinds[index])) {
        console.error(chalk.red(`Error for ${key}:`), snmp.varbindError(varbinds[index]));
      } else {
        const value = varbinds[index].value;
        // Update Device Info nodes as strings.
        if (key === 'softwareVersion') {
          server.update(softwareVersionParameterNode, { value: value.toString() });
          console.log(chalk.green('Updated Software Version:'), value.toString());
        } else if (key === 'stationName') {
          server.update(stationNameParameterNode, { value: value.toString() });
          console.log(chalk.green('Updated Station Name:'), value.toString());
        }
        // Update Monitoring nodes as booleans.
        else {
          const boolVal = (parseInt(value) === 1);
          switch (key) {
            case 'inputAnalog':
              server.update(inputAnalogParameterNode, { value: boolVal });
              console.log(chalk.green('Updated Input Analog:'), boolVal);
              break;
            case 'inputDigital':
              server.update(inputDigitalParameterNode, { value: boolVal });
              console.log(chalk.green('Updated Input Digital:'), boolVal);
              break;
            case 'analogInputSilent':
              server.update(analogInputSilentParameterNode, { value: boolVal });
              console.log(chalk.green('Updated Analog Input Silent:'), boolVal);
              break;
            case 'aesInputSilent':
              server.update(aesInputSilentParameterNode, { value: boolVal });
              console.log(chalk.green('Updated AES Input Silent:'), boolVal);
              break;
            case 'aesInputError':
              server.update(aesInputErrorParameterNode, { value: boolVal });
              console.log(chalk.green('Updated AES Input Error:'), boolVal);
              break;
            case 'powerSupply1Status':
              server.update(powerSupply1StatusParameterNode, { value: boolVal });
              console.log(chalk.green('Updated Power Supply 1 Status:'), boolVal);
              break;
            case 'powerSupply2Status':
              server.update(powerSupply2StatusParameterNode, { value: boolVal });
              console.log(chalk.green('Updated Power Supply 2 Status:'), boolVal);
              break;
          }
        }
      }
    });
  });
}

// Set up polling at the defined interval.
setInterval(pollOptimod, POLL_INTERVAL_MS);
