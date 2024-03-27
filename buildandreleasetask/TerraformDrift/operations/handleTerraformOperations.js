const { spawnSync } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');

// let autoReconcile = true; // or false depending on your needs
const autoReconcile = tl.getBoolInput('autoReconcile', false);

/**
 * Handles Terraform operations for a given working directory.
 *
 * @param {string} workingDirectory - The working
 *  directory for the Terraform operations.
 */
function handleTerraformOperations(workingDirectory) {
    console.log('\x1b[33m%s\x1b[0m', 'Working directory: ', workingDirectory);
  
    // Initialize Terraform
    const init = spawnSync('terraform',
        ['init'], {cwd: workingDirectory, stdio: 'inherit'});
    if (init.error) {
      console.error('\x1b[33m%s\x1b[0m',
          'Error: Terraform init failed');
      process.exit(1);
    }
  
    // Check for drift
    const plan = spawnSync('terraform', ['plan',
      '-detailed-exitcode'],
    {cwd: workingDirectory, stdio: 'inherit'});
  
    if (plan.error) {
      console.error('\x1b[33m%s\x1b[0m', 'Error: Terraform plan failed');
      process.exit(1);
    }
    // If the exit code is 2, there is drift
    if (plan.status === 2) {
      if (autoReconcile) {
        console.log('\x1b[33m%s\x1b[0m',
            'Drift detected.',
            ' AutoReconciliation parameter set to true.',
            'Reconciling...');
        const apply = spawnSync('terraform', ['apply',
          '-auto-approve'],
        {cwd: workingDirectory, stdio: 'inherit'});
        if (apply.error) {
          console.error('Error: Terraform apply failed');
          process.exit(1);
        }
      } else {
        console.log('\x1b[33m%s\x1b[0m',
            'Auto Reconciliation is set to false, please reconcile manually.');
      }
    } else {
      console.log('\x1b[33m%s\x1b[0m',
          'No drift detected.');
    }
  }
  
  module.exports = handleTerraformOperations;