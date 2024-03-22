const { exec } = require('child_process');
const fs = require('fs');

// Get the working directory from the command line arguments
const workingDirectory = process.argv[2];

// Run the Terraform command
exec(`terraform plan -detailed-exitcode -input=false -out=tfplan -lock=false`, { cwd: workingDirectory }, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);

  // Check for drift
  if (error && error.code === 2) {
    console.log('Drift detected.');
    // Write the drift details to a file
    fs.writeFileSync('drift.txt', stdout);
  } else {
    console.log('No drift detected.');
  }
});