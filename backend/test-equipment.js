// Equipment management test script for pump CRUD operations
// Run with: node test-equipment.js

const BASE_URL = 'http://localhost:3001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEquipment() {
  console.log('🔧 Starting Equipment Management Tests\n');

  let cookies = '';
  let adminCookies = '';
  
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
      console.log('❌ Admin login failed. Cannot proceed with equipment tests.');
      return;
    }

    const adminLoginData = await adminLoginResponse.json();
    console.log('✅ Admin login successful');
    
    // Store admin cookies for authenticated requests
    const adminSetCookieHeader = adminLoginResponse.headers.get('set-cookie');
    if (adminSetCookieHeader) {
      adminCookies = adminSetCookieHeader.split(';')[0];
    }
    console.log();

    // Test 2: Get all pumps
    console.log('2️⃣ Testing pump listing...');
    const pumpsResponse = await fetch(`${BASE_URL}/api/bombas`, {
      headers: {
        'Cookie': adminCookies
      }
    });

    if (pumpsResponse.ok) {
      const pumpsData = await pumpsResponse.json();
      console.log('✅ Pump listing retrieved successfully');
      console.log('   Total pumps:', pumpsData.length);
      
      if (pumpsData.length > 0) {
        console.log('   Sample pumps:');
        pumpsData.slice(0, 3).forEach(pump => {
          console.log(`     - ${pump.nome} (${pump.localizacao}) - Status: ${pump.status}`);
        });
      }
      console.log();
    } else {
      console.log('❌ Failed to retrieve pump listing');
      console.log('   Status:', pumpsResponse.status);
      console.log();
    }

    // Test 3: Create a new pump
    console.log('3️⃣ Testing pump creation...');
    
    // Generate unique pump name
    const pumpName = `Test Pump ${Date.now()}`;
    
    const createPumpResponse = await fetch(`${BASE_URL}/api/bombas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookies
      },
      body: JSON.stringify({
        nome: pumpName,
        localizacao: 'Test Location',
        ano_fabricacao: 2020,
        data_instalacao: new Date().toISOString()
      })
    });

    let createdPumpId = null;
    
    if (createPumpResponse.ok) {
      const createPumpData = await createPumpResponse.json();
      console.log('✅ Pump created successfully');
      console.log('   Pump ID:', createPumpData.id);
      console.log('   Pump Name:', createPumpData.nome);
      createdPumpId = createPumpData.id;
      console.log();
    } else {
      const errorData = await createPumpResponse.json();
      console.log('❌ Failed to create pump');
      console.log('   Status:', createPumpResponse.status);
      console.log('   Error:', errorData.message);
      console.log();
    }

    // Test 4: Get the created pump
    if (createdPumpId) {
      console.log('4️⃣ Testing retrieval of created pump...');
      
      const getPumpResponse = await fetch(`${BASE_URL}/api/bombas/${createdPumpId}`, {
        headers: {
          'Cookie': adminCookies
        }
      });

      if (getPumpResponse.ok) {
        const pumpData = await getPumpResponse.json();
        console.log('✅ Pump retrieved successfully');
        console.log('   Pump ID:', pumpData.id);
        console.log('   Pump Name:', pumpData.nome);
        console.log('   Location:', pumpData.localizacao);
        console.log('   Status:', pumpData.status);
        console.log();
      } else {
        console.log('❌ Failed to retrieve pump');
        console.log('   Status:', getPumpResponse.status);
        console.log();
      }
    }

    // Test 5: Update the pump
    if (createdPumpId) {
      console.log('5️⃣ Testing pump update...');
      
      const updatePumpResponse = await fetch(`${BASE_URL}/api/bombas/${createdPumpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': adminCookies
        },
        body: JSON.stringify({
          nome: `${pumpName} - Updated`,
          localizacao: 'Updated Test Location',
          status: 'inativo'
        })
      });

      if (updatePumpResponse.ok) {
        const updatePumpData = await updatePumpResponse.json();
        console.log('✅ Pump updated successfully');
        console.log('   Updated Name:', updatePumpData.nome);
        console.log('   Updated Location:', updatePumpData.localizacao);
        console.log('   Updated Status:', updatePumpData.status);
        console.log();
      } else {
        const errorData = await updatePumpResponse.json();
        console.log('❌ Failed to update pump');
        console.log('   Status:', updatePumpResponse.status);
        console.log('   Error:', errorData.message);
        console.log();
      }
    }

    // Test 6: Test filtering pumps by status
    console.log('6️⃣ Testing pump filtering by status...');
    
    const activePumpsResponse = await fetch(`${BASE_URL}/api/bombas?status=ativo`, {
      headers: {
        'Cookie': adminCookies
      }
    });

    if (activePumpsResponse.ok) {
      const activePumpsData = await activePumpsResponse.json();
      console.log('✅ Active pumps filter working');
      console.log('   Active pumps count:', activePumpsData.length);
      console.log();
    } else {
      console.log('❌ Failed to filter active pumps');
      console.log('   Status:', activePumpsResponse.status);
      console.log();
    }

    const inactivePumpsResponse = await fetch(`${BASE_URL}/api/bombas?status=inativo`, {
      headers: {
        'Cookie': adminCookies
      }
    });

    if (inactivePumpsResponse.ok) {
      const inactivePumpsData = await inactivePumpsResponse.json();
      console.log('✅ Inactive pumps filter working');
      console.log('   Inactive pumps count:', inactivePumpsData.length);
      console.log();
    } else {
      console.log('❌ Failed to filter inactive pumps');
      console.log('   Status:', inactivePumpsResponse.status);
      console.log();
    }

    // Test 7: Delete the pump
    if (createdPumpId) {
      console.log('7️⃣ Testing pump deletion...');
      
      const deletePumpResponse = await fetch(`${BASE_URL}/api/bombas/${createdPumpId}`, {
        method: 'DELETE',
        headers: {
          'Cookie': adminCookies
        }
      });

      if (deletePumpResponse.ok) {
        const deletePumpData = await deletePumpResponse.json();
        console.log('✅ Pump deleted successfully');
        console.log('   Message:', deletePumpData.message);
        console.log();
      } else {
        const errorData = await deletePumpResponse.json();
        console.log('❌ Failed to delete pump');
        console.log('   Status:', deletePumpResponse.status);
        console.log('   Error:', errorData.message);
        console.log();
      }
    }

    // Test 8: Verify pump was deleted
    if (createdPumpId) {
      console.log('8️⃣ Verifying pump deletion...');
      
      const verifyDeleteResponse = await fetch(`${BASE_URL}/api/bombas/${createdPumpId}`, {
        headers: {
          'Cookie': adminCookies
        }
      });

      if (verifyDeleteResponse.status === 404) {
        console.log('✅ Pump deletion verified - pump no longer exists');
        console.log();
      } else {
        console.log('❌ Pump deletion verification failed');
        console.log('   Status:', verifyDeleteResponse.status);
        console.log();
      }
    }

    // Test 9: Test unauthorized access (if we have a non-admin user)
    console.log('9️⃣ Testing unauthorized access protection...');
    
    // This would require creating a non-admin user first
    // For now, we'll test that unauthenticated requests are properly rejected
    try {
      const unauthorizedResponse = await fetch(`${BASE_URL}/api/bombas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: 'Unauthorized Pump',
          localizacao: 'Test Location'
        })
      });
      
      if (unauthorizedResponse.status === 401) {
        console.log('✅ Unauthorized access properly rejected');
      } else {
        console.log('⚠️  Unauthorized access protection may be insufficient');
      }
    } catch (error) {
      console.log('❌ Error testing unauthorized access:', error.message);
    }
    console.log();

    console.log('🔧 Equipment Management tests completed!');

  } catch (error) {
    console.error('❌ Equipment test error:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run equipment tests
testEquipment();