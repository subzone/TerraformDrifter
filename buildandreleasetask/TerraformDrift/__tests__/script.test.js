const { spawnSync } = require('child_process');
const mockProcess = require('jest-mock-process');
const mockConsole = require('jest-mock-console');

jest.mock('child_process');

describe('Terraform Drift Detection', () => {
  let mockExit;
  let restoreConsole;

  beforeEach(() => {
    mockExit = mockProcess.mockProcessExit();
    restoreConsole = mockConsole();
  });

  afterEach(() => {
    mockExit.mockRestore();
    restoreConsole();
  });

  test('should exit with error if terraform plan fails', () => {
    // Arrange
    const plan = { error: true };

    // Act
    // Call your function here with plan as argument
    spawnSync.mockImplementation(() => plan);

    // Call your function here. For example, if your function is named `runTerraformPlan`:
    runTerraformPlan(plan);

    // Assert
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error: Terraform plan failed'));
  });

  // Add more tests for other branches of your code...
});