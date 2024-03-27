const { exec } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const path = require('path');
const customLog = require('logger');

const autoReconcile = tl.getBoolInput('autoReconcile', false);

function handleTofuOperations(workingDirectory) {
    customLog('Working directory: ', workingDirectory);
    customLog('Files in working directory: ', fs.readdirSync(workingDirectory));
    const absoluteWorkingDirectory = path.resolve(workingDirectory).trim();
    customLog('Absolute working directory: ', absoluteWorkingDirectory);
    customLog(autoReconcile);

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
        customLog('Init command output:', stdout);
        customLog('Init command completed');
    
        exec(`docker run ${dockerOptions} plan -detailed-exitcode 2>&1`, (error, stdout, stderr) => {
            if (error) {
                console.error('Output:', stdout);
                if (error.code === 2) {
                    if (autoReconcile) {
                        customLog('Drift detected. AutoReconciliation parameter set to true. Reconciling...');
                        exec(`docker run ${dockerOptions} apply -auto-approve`, (error, stdout, stderr) => {
                            if (error) {
                                console.error('stderr:', stderr);
                                console.error('Error: Apply command failed');
                                return;
                            }
                            customLog('stdout:', stdout);
                            customLog('Apply command completed');
                        });
                    } else {
                        customLog('Auto Reconciliation is set to false, please reconcile manually.');
                    }
                }
                return;
            }
            customLog('Plan command output:', stdout);
            customLog('Plan command completed');
            customLog('No drift detected.');
        });
    });
}

module.exports = handleTofuOperations;