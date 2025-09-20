// Wrapper for ML service to enable proper mocking in tests
import { MLService, mlService } from './ml.service.js';

// Export the same interface as the original module
export { MLService, mlService };
export type { SensorData, MLPredictionResponse, MLServiceError } from './ml.service.js';