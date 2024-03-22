const shell = require('shelljs');

process.on('uncaughtException', function(err) {
    console.error('Caught exception: ', err);
  });

// The working directory is passed as the first argument
let workingDirectory = process.argv[2];

// Navigate to the working directory
shell.cd(workingDirectory);

// Initialize Terraform
if (shell.exec('terraform init').code !== 0) {
  shell.echo('Error: Terraform init failed');
  shell.exit(1);
}

// Check for drift
let result = shell.exec('terraform plan -detailed-exitcode', {silent:true});

// If the exit code is 2, there is drift
if (result.code === 2) {
  shell.echo('Drift detected. Reconciling...');
  if (shell.exec('terraform apply -auto-approve').code !== 0) {
    shell.echo('Error: Terraform apply failed');
    shell.exit(1);
  }
} else {
  shell.echo('No drift detected.');
}