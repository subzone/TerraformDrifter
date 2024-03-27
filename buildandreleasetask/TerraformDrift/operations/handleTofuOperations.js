const { exec } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const path = require('path');

const autoReconcile = tl.getBoolInput('autoReconcile', false);

function handleTofuOperations(workingDirectory) {
    console.log('Working directory: ', workingDirectory);
    console.log('Files in working directory: ', fs.readdirSync(workingDirectory));
    const absoluteWorkingDirectory = path.resolve(workingDirectory).trim();
    console.log('Absolute working directory: ', absoluteWorkingDirectory);

    const dockerOptions = [
        `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID}`,
        `-e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET}`,
        `-e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID}`,
        `-e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`,
        `-v ${absoluteWorkingDirectory.trim()}:/app`,
        '-w /app',
        'ghcr.io/subzone/opentofu:latest'
    ].join(' ');

    exec(`docker run ${dockerOptions} init`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error: Init command failed');
            console.error('stderr:', stderr);
            return;
        }
        console.log('Init command completed');
        console.log('stdout:', stdout);

        exec(`docker run ${dockerOptions} plan -detailed-exitcode`, (error, stdout, stderr) => {
            if (error) {
                console.error('Error: Plan command failed');
                console.error('stderr:', stderr);
                return;
            }
            console.log('Plan command completed');
            console.log('stdout:', stdout);

            if (error && error.code === 2) {
                if (autoReconcile) {
                    console.log('Drift detected. AutoReconciliation parameter set to true. Reconciling...');
                    exec(`docker run ${dockerOptions} apply -auto-approve`, (error, stdout, stderr) => {
                        if (error) {
                            console.error('Error: Apply command failed');
                            console.error('stderr:', stderr);
                            return;
                        }
                        console.log('Apply command completed');
                        console.log('stdout:', stdout);
                    });
                } else {
                    console.log('Auto Reconciliation is set to false, please reconcile manually.');
                }
            } else {
                console.log('No drift detected.');
            }
        });
    });
}

module.exports = handleTofuOperations;
