const { spawnSync } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');

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
    console.log('Files in working directory: ', fs.readdirSync(workingDirectory));
    const absoluteWorkingDirectory = path.resolve(workingDirectory);
    console.log('Absolute working directory: ', absoluteWorkingDirectory);
  
    // Initialize tofu
    const initArgs = [
      `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID}`,
      `-e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET}`,
      `-e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID}`,
      `-e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`,
      `--workdir=${absoluteWorkingDirectory}`,
      `-v ${absoluteWorkingDirectory}/${absoluteWorkingDirectory}`,
      'ghcr.io/subzone/opentofu:latest',
      'init'
    ];
    console.log('Docker command: docker', ...initArgs);
    const init = spawnSync('docker',['run', ...initArgs], { stdio: 'inherit' });
    console.log('Init command=', init);
    if (init.stdout) {
      console.log(init.stdout.toString());
    } else {
      console.error('Docker command failed with error: ', init.error);
    }
    if (init.error) {
      console.error('\x1b[31m%s\x1b[0m', 'Error: tofu init failed');
      process.exit(1);
    }
  
    // Check for drift
    const dockerArgs = [
      `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID}`,
      `-e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET}`,
      `-e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID}`,
      `-e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`,
      `--workdir=${absoluteWorkingDirectory}`,
      `-v ${absoluteWorkingDirectory}/${absoluteWorkingDirectory}`,
      'ghcr.io/subzone/opentofu:latest',
      'plan',
      '-detailed-exitcode'
    ];
    console.log('Docker command: docker', ...dockerArgs)
    const plan = spawnSync('docker',[ 'run', ...dockerArgs ], { stdio: 'inherit' });
     if (plan.stdout) {
      console.log(plan.stdout.toString());
    } else {
      console.error('Docker command failed with error: ', plan.error);
    }
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
        const apply = spawnSync('docker', [ 'run', 
        `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID} -e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET} -e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID} -e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`, 
        ` --workdir=${absoluteWorkingDirectory}`, ` -v ${absoluteWorkingDirectory}:${absoluteWorkingDirectory}`, 'ghcr.io/subzone/opentofu:latest', 'apply',
          '-auto-approve'],
        {cwd: workingDirectory, stdio: 'inherit'});
        if (apply.stdout) {
          console.log(apply.stdout.toString());
        } else {
          console.error('Docker command failed with error: ', apply.error);
        }
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