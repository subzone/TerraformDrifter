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

    const dockerCommand = `docker run -e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID} -e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET} -e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID} -e ARM_TENANT_ID=${process.env.ARM_TENANT_ID} --workdir=/app -v ${absoluteWorkingDirectory.trim()}:/app ghcr.io/subzone/opentofu:latest`;

    exec(`${dockerCommand} init`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Stdout: ${stdout}`);
        console.log('Init command completed');

        exec(`${dockerCommand} plan -detailed-exitcode`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return;
            }
            console.log(`Stdout: ${stdout}`);
            console.log('Plan command completed');

            if (stdout.includes('exit code 2')) {
                if (autoReconcile) {
                    console.log('Drift detected. AutoReconciliation parameter set to true. Reconciling...');
                    exec(`${dockerCommand} apply -auto-approve`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.error(`Stderr: ${stderr}`);
                            return;
                        }
                        console.log(`Stdout: ${stdout}`);
                        console.log('Apply command completed');
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