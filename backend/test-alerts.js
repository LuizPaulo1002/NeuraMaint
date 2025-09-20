// Alert system test script
// Run with: node test-alerts.js

const BASE_URL = 'http://localhost:3001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAlerts() {
  console.log('🚨 Starting Alert System Tests\n');

  let cookies = '';
  
  try {
    // First, login as admin to get authentication
    console.log('1️⃣ Logging in as admin...');
    const adminLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
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

    if (!adminLoginResponse.ok) {
      console.log('❌ Admin login failed. Cannot proceed with alert tests.');
      return;
    }

    const adminLoginData = await adminLoginResponse.json();
    console.log('✅ Admin login successful');
    
    // Store admin cookies for authenticated requests
    const adminSetCookieHeader = adminLoginResponse.headers.get('set-cookie');
    if (adminSetCookieHeader) {
      cookies = adminSetCookieHeader.split(';')[0];
    }
    console.log();

    // Test 2: Get all alerts
    console.log('2️⃣ Testing alert listing...');
    const alertsResponse = await fetch(`${BASE_URL}/api/alertas`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      console.log('✅ Alert listing retrieved successfully');
      console.log('   Total alerts:', alertsData.length);
      
      if (alertsData.length > 0) {
        console.log('   Sample alerts:');
        alertsData.slice(0, 3).forEach(alert => {
          console.log(`     - ${alert.tipo} (${alert.nivel}) for pump ${alert.bomba_id} - Status: ${alert.status}`);
        });
      }
      console.log();
    } else {
      console.log('❌ Failed to retrieve alert listing');
      console.log('   Status:', alertsResponse.status);
      console.log();
    }

    // Test 3: Get pending alerts
    console.log('3️⃣ Testing pending alerts filter...');
    const pendingAlertsResponse = await fetch(`${BASE_URL}/api/alertas?status=pendente`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (pendingAlertsResponse.ok) {
      const pendingAlertsData = await pendingAlertsResponse.json();
      console.log('✅ Pending alerts filter working');
      console.log('   Pending alerts count:', pendingAlertsData.length);
      console.log();
    } else {
      console.log('❌ Failed to filter pending alerts');
      console.log('   Status:', pendingAlertsResponse.status);
      console.log();
    }

    // Test 4: Get high priority alerts
    console.log('4️⃣ Testing high priority alerts filter...');
    const highPriorityAlertsResponse = await fetch(`${BASE_URL}/api/alertas?nivel=alto`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (highPriorityAlertsResponse.ok) {
      const highPriorityAlertsData = await highPriorityAlertsResponse.json();
      console.log('✅ High priority alerts filter working');
      console.log('   High priority alerts count:', highPriorityAlertsData.length);
      console.log();
    } else {
      console.log('❌ Failed to filter high priority alerts');
      console.log('   Status:', highPriorityAlertsResponse.status);
      console.log();
    }

    // Test 5: Create a test alert
    console.log('5️⃣ Testing alert creation...');
    
    // First, we need to get a pump to associate with the alert
    const pumpsResponse = await fetch(`${BASE_URL}/api/bombas`, {
      headers: {
        'Cookie': cookies
      }
    });

    let pumpId = null;
    if (pumpsResponse.ok) {
      const pumpsData = await pumpsResponse.json();
      if (pumpsData.length > 0) {
        pumpId = pumpsData[0].id;
      }
    }

    if (pumpId) {
      const createAlertResponse = await fetch(`${BASE_URL}/api/alertas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          bomba_id: pumpId,
          tipo: 'temperatura_alta',
          nivel: 'medio',
          descricao: 'Test alert created during automated testing'
        })
      });

      let createdAlertId = null;
      
      if (createAlertResponse.ok) {
        const createAlertData = await createAlertResponse.json();
        console.log('✅ Alert created successfully');
        console.log('   Alert ID:', createAlertData.id);
        console.log('   Alert Type:', createAlertData.tipo);
        createdAlertId = createAlertData.id;
        console.log();
      } else {
        const errorData = await createAlertResponse.json();
        console.log('❌ Failed to create alert');
        console.log('   Status:', createAlertResponse.status);
        console.log('   Error:', errorData.message);
        console.log();
      }

      // Test 6: Resolve the created alert
      if (createdAlertId) {
        console.log('6️⃣ Testing alert resolution...');
        
        const resolveAlertResponse = await fetch(`${BASE_URL}/api/alertas/${createdAlertId}/resolver`, {
          method: 'POST',
          headers: {
            'Cookie': cookies
          }
        });

        if (resolveAlertResponse.ok) {
          const resolveAlertData = await resolveAlertResponse.json();
          console.log('✅ Alert resolved successfully');
          console.log('   Updated Status:', resolveAlertData.status);
          console.log('   Resolved At:', resolveAlertData.resolvido_em);
          console.log();
        } else {
          const errorData = await resolveAlertResponse.json();
          console.log('❌ Failed to resolve alert');
          console.log('   Status:', resolveAlertResponse.status);
          console.log('   Error:', errorData.message);
          console.log();
        }
      }
    } else {
      console.log('⚠️  No pumps available to create test alert');
      console.log();
    }

    // Test 7: Test alert statistics endpoint
    console.log('7️⃣ Testing alert statistics endpoint...');
    const statsResponse = await fetch(`${BASE_URL}/api/alertas/estatisticas`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Alert statistics retrieved successfully');
      console.log('   Total alerts:', statsData.total);
      console.log('   Pending alerts:', statsData.pendentes);
      console.log('   Resolved alerts:', statsData.resolvidos);
      console.log('   High priority alerts:', statsData.alto);
      console.log('   Medium priority alerts:', statsData.medio);
      console.log('   Low priority alerts:', statsData.baixo);
      console.log();
    } else {
      console.log('❌ Failed to retrieve alert statistics');
      console.log('   Status:', statsResponse.status);
      console.log();
    }

    // Test 8: Test alert notifications endpoint
    console.log('8️⃣ Testing alert notifications endpoint...');
    const notificationsResponse = await fetch(`${BASE_URL}/api/alertas/notificacoes`, {
      headers: {
        'Cookie': cookies
      }
    });

    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('✅ Alert notifications retrieved successfully');
      console.log('   Notification count:', notificationsData.length);
      console.log();
    } else {
      console.log('❌ Failed to retrieve alert notifications');
      console.log('   Status:', notificationsResponse.status);
      console.log();
    }

    console.log('🚨 Alert System tests completed!');

  } catch (error) {
    console.error('❌ Alert test error:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run alert tests
testAlerts();