const { exec } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');
const fs = require('fs');
const path = require('path');

const provider = tl.getInput('provider', true);

let dockerImage;
switch(provider) {
    case 'azure':
        dockerImage = 'ghcr.io/subzone/opentofu:latest';
        break;
    case 'aws':
        dockerImage = 'ghcr.io/subzone/awsopentofu:latest';
        break;
    case 'gcp':
        dockerImage = 'ghcr.io/subzone/gcpopentofu:latest';
        break;
    default:
        dockerImage = 'ghcr.io/subzone/opentofu:latest';
        break;
}
const autoReconcile = tl.getBoolInput('autoReconcile', false);

function handleTofuOperations(workingDirectory) {
    console.log('\x1b[33m%s\x1b[0m', 'Working directory: ', workingDirectory);
    console.log('\x1b[33m%s\x1b[0m', 'Files in working directory: ', fs.readdirSync(workingDirectory));
    const absoluteWorkingDirectory = path.resolve(workingDirectory).trim();
    console.log('\x1b[33m%s\x1b[0m', 'Absolute working directory: ', absoluteWorkingDirectory);
    console.log('\x1b[33m%s\x1b[0m','Autoreconcile Parameter value:', autoReconcile);
    console.log('\x1b[33m%s\x1b[0m', 'Docker image:', dockerImage);

    const dockerOptions = [
        `-e ARM_CLIENT_ID=${process.env.ARM_CLIENT_ID}`,
        `-e ARM_CLIENT_SECRET=${process.env.ARM_CLIENT_SECRET}`,
        `-e ARM_SUBSCRIPTION_ID=${process.env.ARM_SUBSCRIPTION_ID}`,
        `-e ARM_TENANT_ID=${process.env.ARM_TENANT_ID}`,
        `-e AWS_ACCESS_KEY_ID=${process.env.AWS_ACCESS_KEY_ID}`,
        `-e AWS_SECRET_ACCESS_KEY=${process.env.AWS_SECRET_ACCESS_KEY}`,
        `-e AWS_SESSION_TOKEN=${process.env.AWS_SESSION_TOKEN}`,
        `-e GCP_PROJECT_ID=${process.env.GCP_PROJECT_ID}`,
        `-e GCP_CLIENT_EMAIL=${process.env.GCP_CLIENT_EMAIL}`,
        `-e GCP_PRIVATE_KEY=${process.env.GCP_PRIVATE_KEY}`,
        `-v ${absoluteWorkingDirectory.trim()}:/app`,
        '-w /app',
        `${dockerImage}`
    ].join(' ');

    exec(`docker run ${dockerOptions} init`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error: Init command failed');
            return;
        }
        console.log('\x1b[33m%s\x1b[0m', 'Init command output:', stdout);
        console.log('\x1b[33m%s\x1b[0m', 'Init command completed');
    
        exec(`docker run ${dockerOptions} plan -detailed-exitcode 2>&1`, (error, stdout, stderr) => {
            if (error) {
                console.error('\x1b[33m%s\x1b[0m', 'Output:', stdout);
                if (error.code === 2) {
                    if (autoReconcile) {
                        console.log('\x1b[33m%s\x1b[0m', 'Drift detected. AutoReconciliation parameter set to true. Reconciling...');
                        exec(`docker run ${dockerOptions} apply -auto-approve`, (error, stdout, stderr) => {
                            if (error) {
                                console.error('stderr:', stderr);
                                console.error('Error: Apply command failed');
                                return;
                            }
                            console.log('\x1b[33m%s\x1b[0m', 'stdout:', stdout);
                            console.log('\x1b[33m%s\x1b[0m', 'Apply command completed');
                        });
                    } else {
                        console.log('\x1b[33m%s\x1b[0m', 'Auto Reconciliation is set to false, please reconcile manually.');
                    }
                }
                return;
            }
            console.log('\x1b[33m%s\x1b[0m', 'Plan command output:', stdout);
            console.log('\x1b[33m%s\x1b[0m', 'Plan command completed');
            console.log('\x1b[33m%s\x1b[0m', 'No drift detected.');
        });
    });
}

module.exports = handleTofuOperations;