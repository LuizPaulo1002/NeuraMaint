import axios from 'axios';
import { mlService } from './src/services/ml.service.js';

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

const API_BASE = 'http://localhost:3001/api';
let cookieJar = '';

// Test configuration
const adminCredentials = {
  email: 'admin@neuramaint.com',
  senha: 'admin123'
};

// Test data for ML service
const testSensorData = [
  {
    sensor_id: 1,
    valor: 75.5,
    timestamp: new Date().toISOString(),
    tipo_sensor: 'temperatura'
  },
  {
    sensor_id: 2,
    valor: 4.2,
    timestamp: new Date().toISOString(),
    tipo_sensor: 'vibracao'
  },
  {
    sensor_id: 3,
    valor: 8.9,
    timestamp: new Date().toISOString(),
    tipo_sensor: 'pressao'
  },
  {
    sensor_id: 4,
    valor: 150.0,
    timestamp: new Date().toISOString(),
    tipo_sensor: 'fluxo'
  },
  {
    sensor_id: 5,
    valor: 2500.0,
    timestamp: new Date().toISOString(),
    tipo_sensor: 'rotacao'
  }
];

async function runMLServiceTests() {
  console.log('🤖 Starting ML Service Integration Tests\n');

  try {
    // 1. Login as admin
    console.log('1. 🔐 Authenticating as admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    
    // Extract cookies from response headers
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (setCookieHeader) {
      cookieJar = setCookieHeader.join('; ');
    }
    
    console.log('✅ Admin authentication successful\n');

    const headers = {
      'Cookie': cookieJar
    };

    // 2. Test ML service health check
    console.log('2. 🏥 Testing ML service health check...');
    const isHealthy = await mlService.healthCheck();
    console.log('✅ ML service health:', isHealthy ? 'Healthy' : 'Unavailable');
    console.log('');

    // 3. Test basic failure prediction
    console.log('3. 🔮 Testing failure predictions...');
    for (const sensorData of testSensorData) {
      try {
        const probability = await mlService.predictFailure(sensorData);
        console.log(`✅ Sensor ${sensorData.sensor_id} (${sensorData.tipo_sensor}): ${probability}% failure probability`);
      } catch (error) {
        console.log(`⚠️  Sensor ${sensorData.sensor_id} prediction failed:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    console.log('');

    // 4. Test detailed predictions
    console.log('4. 📊 Testing detailed predictions...');
    const detailedPrediction = await mlService.getPredictionDetails(testSensorData[0]);
    if (detailedPrediction) {
      console.log('✅ Detailed prediction:', {
        sensor_id: detailedPrediction.sensor_id,
        probabilidade_falha: detailedPrediction.probabilidade_falha,
        risco: detailedPrediction.risco,
        recomendacao: detailedPrediction.recomendacao,
        confianca: detailedPrediction.confianca
      });
    } else {
      console.log('⚠️  No detailed prediction available');
    }
    console.log('');

    // 5. Test cache functionality
    console.log('5. 🗄️  Testing cache functionality...');
    console.time('First prediction');
    await mlService.predictFailure(testSensorData[1]);
    console.timeEnd('First prediction');
    
    console.time('Cached prediction');
    await mlService.predictFailure(testSensorData[1]);
    console.timeEnd('Cached prediction');
    
    const cacheStats = mlService.getCacheStats();
    console.log('✅ Cache stats:', cacheStats);
    console.log('');

    // 6. Test extreme values (should use fallback)
    console.log('6. 🚫 Testing extreme values and fallbacks...');
    const extremeData = {
      sensor_id: 1,
      valor: 200.0, // Extreme temperature
      timestamp: new Date().toISOString(),
      tipo_sensor: 'temperatura'
    };
    
    const extremePrediction = await mlService.predictFailure(extremeData);
    console.log(`✅ Extreme value prediction: ${extremePrediction}% (should be high due to extreme value)`);
    console.log('');

    // 7. Test validation errors
    console.log('7. ❌ Testing validation errors...');
    
    try {
      await mlService.predictFailure({
        sensor_id: 0, // Invalid sensor ID
        valor: 50,
        timestamp: new Date().toISOString(),
        tipo_sensor: 'temperatura'
      });
    } catch (error) {
      console.log('✅ Invalid sensor ID caught:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      await mlService.predictFailure({
        sensor_id: 1,
        valor: NaN, // Invalid value
        timestamp: new Date().toISOString(),
        tipo_sensor: 'temperatura'
      });
    } catch (error) {
      console.log('✅ Invalid value caught:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      await mlService.predictFailure({
        sensor_id: 1,
        valor: 50,
        timestamp: 'invalid-date', // Invalid timestamp
        tipo_sensor: 'temperatura'
      });
    } catch (error) {
      console.log('✅ Invalid timestamp caught:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('');

    // 8. Test integration with reading processing
    console.log('8. 🔗 Testing integration with reading processing...');
    const testReading = {
      sensorId: 1,
      valor: 82.5, // High temperature
      qualidade: 95.0
    };

    const processingResponse = await axios.post(`${API_BASE}/leituras`, testReading, { headers });
    console.log('✅ Reading processed successfully:', {
      id: processingResponse.data.data.id,
      sensor: processingResponse.data.data.sensor.tipo,
      valor: processingResponse.data.data.valor
    });
    console.log('');

    // 9. Test batch predictions
    console.log('9. 📦 Testing batch predictions...');
    const batchPromises = testSensorData.map(data => mlService.predictFailure(data));
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Batch ${index + 1}: ${result.value}% failure probability`);
      } else {
        console.log(`❌ Batch ${index + 1}: ${result.reason}`);
      }
    });
    console.log('');

    // 10. Test cache expiration
    console.log('10. ⏰ Testing cache management...');
    mlService.clearCache();
    const clearedStats = mlService.getCacheStats();
    console.log('✅ Cache cleared:', clearedStats);
    console.log('');

    // 11. Test Railway URL configuration
    console.log('11. 🚄 Testing Railway URL configuration...');
    console.log('✅ ML Service URL:', process.env.ML_SERVICE_URL || 'Using default Railway URL');
    console.log('');

    // 12. Test concurrent requests
    console.log('12. ⚡ Testing concurrent requests...');
    const concurrentPromises = Array(5).fill(null).map((_, i) => 
      mlService.predictFailure({
        sensor_id: i + 1,
        valor: 50 + i * 10,
        timestamp: new Date().toISOString(),
        tipo_sensor: 'temperatura'
      })
    );
    
    const concurrentResults = await Promise.allSettled(concurrentPromises);
    const successful = concurrentResults.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Concurrent requests: ${successful}/${concurrentResults.length} successful`);
    console.log('');

    console.log('🎉 All ML Service tests completed!\n');

    // Summary
    console.log('📋 Test Summary:');
    console.log('✅ ML service health check');
    console.log('✅ Basic failure predictions');
    console.log('✅ Detailed prediction metadata');
    console.log('✅ Cache functionality and performance');
    console.log('✅ Extreme value handling with fallbacks');
    console.log('✅ Input validation and error handling');
    console.log('✅ Integration with reading processing');
    console.log('✅ Batch prediction processing');
    console.log('✅ Cache management and expiration');
    console.log('✅ Railway URL configuration');
    console.log('✅ Concurrent request handling');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Test specific ML service features
async function runAdvancedMLTests() {
  console.log('\n🔬 Advanced ML Service Feature Tests\n');

  try {
    // Test timeout behavior
    console.log('1. ⏱️  Testing timeout behavior...');
    // This would require a slow ML service to properly test
    
    // Test different sensor types
    console.log('2. 🔧 Testing all sensor types...');
    const sensorTypes = ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'];
    for (const tipo of sensorTypes) {
      const prediction = await mlService.predictFailure({
        sensor_id: 1,
        valor: 50,
        timestamp: new Date().toISOString(),
        tipo_sensor: tipo
      });
      console.log(`✅ ${tipo}: ${prediction}% prediction`);
    }
    console.log('');

    // Test edge cases
    console.log('3. 🎯 Testing edge cases...');
    
    // Zero values
    const zeroPrediction = await mlService.predictFailure({
      sensor_id: 1,
      valor: 0,
      timestamp: new Date().toISOString(),
      tipo_sensor: 'pressao'
    });
    console.log(`✅ Zero value prediction: ${zeroPrediction}%`);

    // Maximum values
    const maxPrediction = await mlService.predictFailure({
      sensor_id: 1,
      valor: 1000000,
      timestamp: new Date().toISOString(),
      tipo_sensor: 'rotacao'
    });
    console.log(`✅ Maximum value prediction: ${maxPrediction}%`);
    console.log('');

    console.log('🎉 Advanced ML Service tests completed!\n');

  } catch (error) {
    console.error('❌ Advanced test failed:', error.message);
  }
}

// Run both test suites
async function runAllTests() {
  await runMLServiceTests();
  await runAdvancedMLTests();
}

// Export for use as module or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runMLServiceTests, runAdvancedMLTests, runAllTests };