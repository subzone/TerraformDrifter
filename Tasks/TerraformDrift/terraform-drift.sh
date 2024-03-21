#!/bin/bash

# The working directory is passed as the first argument
workingDirectory=$1

# Navigate to the working directory
cd $workingDirectory

# Initialize Terraform
terraform init

# Check for drift
drift=$(terraform plan -detailed-exitcode)

# If the exit code is 2, there is drift
if [ $? -eq 2 ]
then
  echo "Drift detected. Reconciling..."
  terraform apply -auto-approve
else
  echo "No drift detected."
fi