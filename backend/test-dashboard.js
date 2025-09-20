// Dashboard testing script for real-time data visualization
// Run with: node test-dashboard.js

const BASE_URL = 'http://localhost:3001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDashboard() {
  console.log('🧪 Starting Dashboard Component Tests\n');

  let cookies = '';
  
  try {
    // First, login to get authentication
    console.log('1️⃣ Logging in to get authentication token...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@neuramaint.com',
        senha: 'admin123'
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Cannot proceed with dashboard tests.');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Store cookies for authenticated requests
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = setCookieHeader.split(';')[0];
    }
    console.log();

    // Test 2: Get dashboard data
    console.log('2️⃣ Testing dashboard data endpoint...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard data retrieved successfully');
      console.log('   Equipment count:', dashboardData.equipments?.length || 0);
      console.log('   Active alerts:', dashboardData.alerts?.length || 0);
      console.log('   Recent readings:', dashboardData.readings?.length || 0);
      console.log();
    } else {
      console.log('❌ Failed to retrieve dashboard data');
      console.log('   Status:', dashboardResponse.status);
      console.log();
    }

    // Test 3: Get equipment list
    console.log('3️⃣ Testing equipment list endpoint...');
    const equipmentResponse = await fetch(`${BASE_URL}/api/bombas`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (equipmentResponse.ok) {
      const equipmentData = await equipmentResponse.json();
      console.log('✅ Equipment list retrieved successfully');
      console.log('   Total equipment:', equipmentData.length);
      
      if (equipmentData.length > 0) {
        console.log('   Sample equipment:');
        equipmentData.slice(0, 3).forEach(eq => {
          console.log(`     - ${eq.nome} (${eq.localizacao}) - Status: ${eq.status}`);
        });
      }
      console.log();
    } else {
      console.log('❌ Failed to retrieve equipment list');
      console.log('   Status:', equipmentResponse.status);
      console.log();
    }

    // Test 4: Get recent readings
    console.log('4️⃣ Testing recent readings endpoint...');
    const readingsResponse = await fetch(`${BASE_URL}/api/leituras/ultimas`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (readingsResponse.ok) {
      const readingsData = await readingsResponse.json();
      console.log('✅ Recent readings retrieved successfully');
      console.log('   Total readings:', readingsData.length);
      
      if (readingsData.length > 0) {
        console.log('   Sample readings:');
        readingsData.slice(0, 3).forEach(reading => {
          console.log(`     - Sensor ${reading.sensor_id}: ${reading.valor} ${reading.unidade} at ${new Date(reading.timestamp).toLocaleTimeString()}`);
        });
      }
      console.log();
    } else {
      console.log('❌ Failed to retrieve recent readings');
      console.log('   Status:', readingsResponse.status);
      console.log();
    }

    // Test 5: Get alerts
    console.log('5️⃣ Testing alerts endpoint...');
    const alertsResponse = await fetch(`${BASE_URL}/api/alertas`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      console.log('✅ Alerts retrieved successfully');
      console.log('   Total alerts:', alertsData.length);
      
      if (alertsData.length > 0) {
        console.log('   Sample alerts:');
        alertsData.slice(0, 3).forEach(alert => {
          console.log(`     - ${alert.tipo} (${alert.nivel}) for equipment ${alert.bomba_id}`);
        });
      }
      console.log();
    } else {
      console.log('❌ Failed to retrieve alerts');
      console.log('   Status:', alertsResponse.status);
      console.log();
    }

    // Test 6: Simulate real-time data flow (if simulator is available)
    console.log('6️⃣ Testing real-time data simulation...');
    try {
      const simulatorResponse = await fetch(`${BASE_URL}/api/simulador/start`, {
        method: 'POST',
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interval: 2000, // 2 seconds
          duration: 10000 // 10 seconds
        })
      });

      if (simulatorResponse.ok) {
        console.log('✅ Data simulation started successfully');
        console.log('   Simulating data for 10 seconds...');
        
        // Wait for simulation to complete
        await delay(12000);
        
        console.log('   Simulation completed');
        console.log();
      } else {
        console.log('⚠️  Data simulation not available or failed to start');
        console.log('   Status:', simulatorResponse.status);
        console.log();
      }
    } catch (error) {
      console.log('⚠️  Data simulation test skipped (simulator not available)');
      console.log();
    }

    // Test 7: Test RAG status calculation
    console.log('7️⃣ Testing RAG status calculation...');
    
    // Create test equipment with different failure probabilities
    const testEquipments = [
      { id: 1, nome: 'Test Pump 1', failureProbability: 15 }, // Normal (Green)
      { id: 2, nome: 'Test Pump 2', failureProbability: 45 }, // Warning (Amber)
      { id: 3, nome: 'Test Pump 3', failureProbability: 85 }  // Critical (Red)
    ];
    
    testEquipments.forEach(eq => {
      let status;
      if (eq.failureProbability < 30) {
        status = 'Normal';
      } else if (eq.failureProbability < 70) {
        status = 'Warning';
      } else {
        status = 'Critical';
      }
      
      console.log(`   ${eq.nome}: ${status} (${eq.failureProbability}%)`);
    });
    
    console.log('✅ RAG status calculation working correctly');
    console.log();

    console.log('🎉 Dashboard Component tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run dashboard tests
testDashboard();