# Terraform Drift Azure DevOps Task

This is an Azure DevOps task that checks for Terraform drift and enables reconciliation.

## Features

- Checks for Terraform drift in your infrastructure
- Enables reconciliation of the drift

## Requirements

- Azure DevOps
- Terraform

## Installation

1. Package the extension by running `tfx extension create --manifest-globs vss-extension.json` in the directory containing the `vss-extension.json` file. This will create a `.vsix` file.
2. Upload the `.vsix` file to your Azure DevOps organization.
3. Install the extension to your organization.

## Usage

After installing the extension, you can add the Terraform Drift task to any of your pipelines.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)