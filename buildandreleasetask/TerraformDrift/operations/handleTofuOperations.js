const { spawnSync } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');

// let autoReconcile = true; // or false depending on your needs
const autoReconcile = tl.getBoolInput('autoReconcile', false);
const path = require('path');

/**
 * Handles tofu operations for a given working directory.
 *
 * @param {string} workingDirectory - The working
 *  directory for the tofu operations.
 */
function handleTofuOperations(workingDirectory) {
    console.log('Working directory: ', workingDirectory);
    const absoluteWorkingDirectory = path.resolve(workingDirectory);
    console.log('Absolute working directory: ', absoluteWorkingDirectory);
  
    // Initialize tofu
    const init = spawnSync('docker', ['run', 
    `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID} -e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET} -e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID} -e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`,
    ` --workdir=${absoluteWorkingDirectory}`, ` -v ${absoluteWorkingDirectory}:${absoluteWorkingDirectory}`,
    'ghcr.io/subzone/opentofu:latest', 'init'],
    { stdio: 'inherit' });
    console.log(init.stdout.toString());
    if (init.error) {
      console.error('\x1b[31m%s\x1b[0m', 'Error: tofu init failed');
      process.exit(1);
    }
  
    // Check for drift
    const plan = spawnSync('docker', ['run',
    `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID} -e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET} -e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID} -e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`,
    ` --workdir=${absoluteWorkingDirectory}`, ` -v ${absoluteWorkingDirectory}:${absoluteWorkingDirectory}`,
    'ghcr.io/subzone/opentofu:latest', 'plan', '-detailed-exitcode'],
     { stdio: 'inherit' });
     console.log(plan.stdout.toString());
    if (plan.error) {
      console.error('\x1b[31m%s\x1b[0m', 'Error: tofu plan failed');
      process.exit(1);
    }
    // If the exit code is 2, there is drift
    if (plan.status === 2) {
      if (autoReconcile) {
        console.log('\x1b[33m%s\x1b[0m\n\x1b[33m%s\x1b[0m',
            'Drift detected.',
            ' AutoReconciliation parameter set to true.',
            'Reconciling...');
        const apply = spawnSync('docker', ['run', 
        `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID} -e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET} -e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID} -e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`, 
        ` --workdir=${absoluteWorkingDirectory}`, ` -v ${absoluteWorkingDirectory}:${absoluteWorkingDirectory}`, 'ghcr.io/subzone/opentofu:latest', 'apply',
          '-auto-approve'],
        {cwd: workingDirectory, stdio: 'inherit'});
        console.log(apply.stdout.toString());
        if (apply.error) {
          console.error('Error: tofu apply failed');
          process.exit(1);
        }
      } else {
        console.log('\x1b[32m%s\x1b[0m',
            'Auto Reconciliation is set to false, please reconcile manually.');
      }
    } else {
      console.log('\x1b[32m%s\x1b[0m',
          'No drift detected.');
    }
  }
  
  module.exports = handleTofuOperations;