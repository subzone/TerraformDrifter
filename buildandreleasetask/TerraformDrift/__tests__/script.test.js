const { spawnSync } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');
const handleTerraformOperations = require('../terraform-drift.js');

jest.mock('azure-pipelines-task-lib/task', () => ({
  getInput: jest.fn().mockImplementation((name, required) => {
    switch (name) {
      case 'provider':
        return 'azure';
      case 'workingDirectory':
        return 'terraform';
      case 'autoReconcile':
        return true;
      default:
        return null;
    }
  }),
  getBoolInput: jest.fn().mockReturnValue(true),
  getEndpointAuthorizationParameter: jest.fn().mockReturnValue('mock-value'),
  getEndpointDataParameter: jest.fn().mockReturnValue('mock-value'),
}));

jest.mock('child_process', () => ({
  spawnSync: jest.fn().mockReturnValue({ error: null, status: 0 }),
}));

describe('handleTerraformOperations', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    spawnSync.mockClear();
  });

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    spawnSync.mockClear();
  });

  it('should call terraform init and plan', () => {
    handleTerraformOperations('terraform');

    expect(spawnSync).toHaveBeenCalledWith('terraform', ['init'], expect.anything());
    expect(spawnSync).toHaveBeenCalledWith('terraform', ['plan', '-detailed-exitcode'], expect.anything());
  });

  it('should call terraform apply if there is drift and autoReconcile is true', () => {
    tl.getBoolInput.mockReturnValueOnce(true);
    spawnSync.mockImplementation((command, args) => {
      if (args[0] === 'plan') {
        return { error: null, status: 2 };
      } else if (args[0] === 'apply') {
        return { error: null, status: 0 };
      } else {
        return { error: null, status: 0 };
      }
    });
  
    handleTerraformOperations('terraform');
  
    expect(spawnSync).toHaveBeenCalledWith('terraform', ['apply', '-auto-approve'], expect.anything());
  });

  it('should not call terraform apply if there is no drift', () => {
    spawnSync.mockReturnValueOnce({ error: null, status: 0 })
      .mockReturnValueOnce({ error: null, status: 0 });

    handleTerraformOperations('terraform');

    expect(spawnSync).not.toHaveBeenCalledWith('terraform', ['apply', '-auto-approve'], expect.anything());
  });
  // Add more tests as needed...
});