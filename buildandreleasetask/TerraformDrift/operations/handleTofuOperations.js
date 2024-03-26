const Docker = require('dockerode');
const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const path = require('path');

const autoReconcile = tl.getBoolInput('autoReconcile', false);
const docker = new Docker();

function handleTofuOperations(workingDirectory) {
    console.log('Working directory: ', workingDirectory);
    console.log('Files in working directory: ', fs.readdirSync(workingDirectory));
    const absoluteWorkingDirectory = path.resolve(workingDirectory).trim();
    console.log('Absolute working directory: ', absoluteWorkingDirectory);

    const dockerOptions = {
        Image: 'ghcr.io/subzone/opentofu:latest',
        Env: [
            `ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID}`,
            `ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET}`,
            `ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID}`,
            `ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`
        ],
        WorkingDir: '/app',
        HostConfig: {
            Binds: [`${absoluteWorkingDirectory.trim()}:/app`]
        }
    };

    docker.run(dockerOptions, ['init'], process.stdout, function (err, data, container) {
        if (err) {
            console.error(`Error: ${err.message}`);
            return;
        }
        console.log('Init command completed');

        docker.run(dockerOptions, ['plan', '-detailed-exitcode'], process.stdout, function (err, data, container) {
            if (err) {
                console.error(`Error: ${err.message}`);
                return;
            }
            console.log('Plan command completed');

            if (data.StatusCode === 2) {
                if (autoReconcile) {
                    console.log('Drift detected. AutoReconciliation parameter set to true. Reconciling...');
                    docker.run(dockerOptions, ['apply', '-auto-approve'], process.stdout, function (err, data, container) {
                        if (err) {
                            console.error(`Error: ${err.message}`);
                            return;
                        }
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
