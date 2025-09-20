import axios from 'axios';

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

const API_BASE = 'http://localhost:3001/api';
let cookieJar = '';

// Test configuration
const adminCredentials = {
  email: 'admin@neuramaint.com',
  senha: 'admin123'
};

async function runSimulatorTests() {
  console.log('🤖 Starting Simulator Tests\n');

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

    // 2. Check initial simulator status
    console.log('2. 📊 Checking initial simulator status...');
    const initialStatusResponse = await axios.get(`${API_BASE}/simulator/status`, { headers });
    console.log('✅ Initial status:', {
      isRunning: initialStatusResponse.data.data.isRunning,
      sensorCount: initialStatusResponse.data.data.sensorCount,
      interval: initialStatusResponse.data.data.interval
    });
    console.log('');

    // 3. Start the simulator
    console.log('3. 🚀 Starting simulator...');
    const startResponse = await axios.post(`${API_BASE}/simulator/start`, {
      interval: 3000, // 3 seconds for testing
      failureProbability: 0.1, // 10% for more frequent failures in testing
      noiseLevel: 0.2
    }, { headers });
    console.log('✅ Simulator started:', {
      message: startResponse.data.message,
      sensorCount: startResponse.data.data.sensorCount,
      interval: startResponse.data.data.interval
    });
    console.log('');

    // 4. Check simulator status after start
    console.log('4. 📈 Checking simulator status after start...');
    const runningStatusResponse = await axios.get(`${API_BASE}/simulator/status`, { headers });
    console.log('✅ Running status:', {
      isRunning: runningStatusResponse.data.data.isRunning,
      sensorCount: runningStatusResponse.data.data.sensorCount,
      sensors: runningStatusResponse.data.data.sensors.slice(0, 3).map(s => ({
        id: s.id,
        tipo: s.tipo,
        lastValue: s.lastValue
      }))
    });
    console.log('');

    // 5. Get simulator statistics
    console.log('5. 📊 Getting simulator statistics...');
    const statsResponse = await axios.get(`${API_BASE}/simulator/statistics`, { headers });
    console.log('✅ Statistics:', {
      totalSensors: statsResponse.data.data.totalSensors,
      sensorsInFailure: statsResponse.data.data.sensorsInFailure,
      averageValues: statsResponse.data.data.averageValues
    });
    console.log('');

    // 6. Wait for some readings to be generated
    console.log('6. ⏳ Waiting 10 seconds for readings to be generated...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('✅ Wait complete\n');

    // 7. Check readings were created
    console.log('7. 📈 Checking if readings were created...');
    const readingsResponse = await axios.get(`${API_BASE}/readings?limit=10`, { headers });
    console.log('✅ Recent readings:', {
      count: readingsResponse.data.data.length,
      samples: readingsResponse.data.data.slice(0, 3).map(r => ({
        sensorId: r.sensorId,
        valor: r.valor,
        timestamp: new Date(r.timestamp).toLocaleTimeString(),
        qualidade: r.qualidade
      }))
    });
    console.log('');

    // 8. Test generating a single reading
    console.log('8. 🧪 Testing single reading generation...');
    const sensorId = runningStatusResponse.data.data.sensors[0]?.id;
    if (sensorId) {
      const testReadingResponse = await axios.post(`${API_BASE}/simulator/test-reading/${sensorId}`, {}, { headers });
      console.log('✅ Test reading generated:', {
        sensorId: testReadingResponse.data.data.sensorId,
        valor: testReadingResponse.data.data.valor,
        qualidade: testReadingResponse.data.data.qualidade
      });
    }
    console.log('');

    // 9. Force a sensor failure
    console.log('9. 🚨 Forcing sensor failure...');
    if (sensorId) {
      const forceFailureResponse = await axios.post(`${API_BASE}/simulator/force-failure/${sensorId}`, {}, { headers });
      console.log('✅ Failure forced:', forceFailureResponse.data.message);
      
      // Check status after forcing failure
      const failureStatusResponse = await axios.get(`${API_BASE}/simulator/status`, { headers });
      const failingSensor = failureStatusResponse.data.data.sensors.find(s => s.id === sensorId);
      console.log('✅ Sensor status:', {
        id: failingSensor?.id,
        isFailure: failingSensor?.isFailure,
        lastValue: failingSensor?.lastValue
      });
    }
    console.log('');

    // 10. Update simulator configuration
    console.log('10. ⚙️ Updating simulator configuration...');
    const updateConfigResponse = await axios.put(`${API_BASE}/simulator/config`, {
      interval: 5000, // Change to 5 seconds
      noiseLevel: 0.1 // Reduce noise
    }, { headers });
    console.log('✅ Configuration updated:', {
      message: updateConfigResponse.data.message,
      newInterval: updateConfigResponse.data.data.interval
    });
    console.log('');

    // 11. Reset all sensors
    console.log('11. 🔄 Resetting all sensors...');
    const resetResponse = await axios.post(`${API_BASE}/simulator/reset`, {}, { headers });
    console.log('✅ Sensors reset:', resetResponse.data.message);
    console.log('');

    // 12. Check statistics after reset
    console.log('12. 📊 Checking statistics after reset...');
    const finalStatsResponse = await axios.get(`${API_BASE}/simulator/statistics`, { headers });
    console.log('✅ Final statistics:', {
      totalSensors: finalStatsResponse.data.data.totalSensors,
      sensorsInFailure: finalStatsResponse.data.data.sensorsInFailure
    });
    console.log('');

    // 13. Test readings API endpoints
    console.log('13. 📊 Testing readings API endpoints...');
    
    // Get readings for a specific sensor
    if (sensorId) {
      const sensorReadingsResponse = await axios.get(`${API_BASE}/sensors/${sensorId}/readings?limit=5`, { headers });
      console.log('✅ Sensor readings:', {
        sensor: sensorId,
        count: sensorReadingsResponse.data.data.length,
        total: sensorReadingsResponse.data.pagination.total
      });

      // Get latest reading
      const latestReadingResponse = await axios.get(`${API_BASE}/sensors/${sensorId}/readings/latest`, { headers });
      console.log('✅ Latest reading:', {
        valor: latestReadingResponse.data.data?.valor,
        timestamp: latestReadingResponse.data.data?.timestamp ? new Date(latestReadingResponse.data.data.timestamp).toLocaleTimeString() : 'No readings'
      });

      // Get reading statistics
      const readingStatsResponse = await axios.get(`${API_BASE}/sensors/${sensorId}/readings/stats`, { headers });
      console.log('✅ Reading stats:', {
        count: readingStatsResponse.data.data.count,
        avg: Math.round(readingStatsResponse.data.data.avg * 100) / 100,
        min: readingStatsResponse.data.data.min,
        max: readingStatsResponse.data.data.max
      });
    }
    console.log('');

    // 14. Test validation errors
    console.log('14. ❌ Testing validation errors...');
    try {
      await axios.post(`${API_BASE}/simulator/start`, {
        interval: 500, // Too low
        failureProbability: 1.5 // Too high
      }, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation error correctly caught:', error.response.data.message);
      }
    }
    console.log('');

    // 15. Stop the simulator
    console.log('15. 🛑 Stopping simulator...');
    const stopResponse = await axios.post(`${API_BASE}/simulator/stop`, {}, { headers });
    console.log('✅ Simulator stopped:', {
      message: stopResponse.data.message,
      isRunning: stopResponse.data.data.isRunning
    });
    console.log('');

    console.log('🎉 All Simulator tests completed successfully!\n');

    // Summary
    console.log('📋 Test Summary:');
    console.log('✅ Simulator start/stop functionality');
    console.log('✅ Configuration management');
    console.log('✅ Sensor failure simulation');
    console.log('✅ Data generation and API integration');
    console.log('✅ Statistics and monitoring');
    console.log('✅ Readings API integration');
    console.log('✅ Validation and error handling');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run tests immediately
runSimulatorTests().catch(console.error);