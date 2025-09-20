// Test script for Pump CRUD operations
// Run with: node test-pumps.js

const BASE_URL = 'http://localhost:3001';

async function testPumpCRUD() {
  console.log('🧪 Testing NeuraMaint Pump CRUD API\n');

  let authCookies = '';

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
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
      throw new Error('Login failed');
    }

    authCookies = loginResponse.headers.get('set-cookie') || '';
    console.log('✅ Admin login successful\n');

    // Step 2: Create a new pump
    console.log('2️⃣ Creating a new pump...');
    const timestamp = Date.now();
    const createPumpResponse = await fetch(`${BASE_URL}/api/pumps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify({
        nome: `Bomba Teste CRUD ${timestamp}`,
        modelo: 'BC-TESTE-001',
        localizacao: 'Setor D - Teste',
        capacidade: 250.0,
        potencia: 12.5,
        anoFabricacao: 2023,
        status: 'ativo',
        observacoes: 'Bomba criada para teste do CRUD'
      })
    });

    if (!createPumpResponse.ok) {
      const errorData = await createPumpResponse.json();
      throw new Error(`Create pump failed: ${errorData.message}`);
    }

    const createdPump = await createPumpResponse.json();
    const pumpId = createdPump.data.id;
    console.log('✅ Pump created successfully');
    console.log('   ID:', pumpId);
    console.log('   Name:', createdPump.data.nome);
    console.log('   RAG Status:', createdPump.data.ragStatus);
    console.log();

    // Step 3: Get pump by ID
    console.log('3️⃣ Getting pump by ID...');
    const getPumpResponse = await fetch(`${BASE_URL}/api/pumps/${pumpId}`, {
      headers: {
        'Cookie': authCookies
      }
    });

    if (!getPumpResponse.ok) {
      throw new Error('Get pump failed');
    }

    const retrievedPump = await getPumpResponse.json();
    console.log('✅ Pump retrieved successfully');
    console.log('   Name:', retrievedPump.data.nome);
    console.log('   Location:', retrievedPump.data.localizacao);
    console.log('   Status:', retrievedPump.data.status);
    console.log('   RAG Status:', retrievedPump.data.ragStatus);
    console.log();

    // Step 4: Update pump
    console.log('4️⃣ Updating pump...');
    const updatePumpResponse = await fetch(`${BASE_URL}/api/pumps/${pumpId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify({
        nome: `Bomba Teste CRUD ${timestamp} - Atualizada`,
        observacoes: 'Bomba atualizada via teste CRUD',
        capacidade: 300.0
      })
    });

    if (!updatePumpResponse.ok) {
      const errorData = await updatePumpResponse.json();
      throw new Error(`Update pump failed: ${errorData.message}`);
    }

    const updatedPump = await updatePumpResponse.json();
    console.log('✅ Pump updated successfully');
    console.log('   New Name:', updatedPump.data.nome);
    console.log('   New Capacity:', updatedPump.data.capacidade);
    console.log();

    // Step 5: Get all pumps
    console.log('5️⃣ Getting all pumps...');
    const getAllPumpsResponse = await fetch(`${BASE_URL}/api/pumps?page=1&limit=5`, {
      headers: {
        'Cookie': authCookies
      }
    });

    if (!getAllPumpsResponse.ok) {
      throw new Error('Get all pumps failed');
    }

    const allPumpsData = await getAllPumpsResponse.json();
    console.log('✅ All pumps retrieved successfully');
    console.log('   Total pumps:', allPumpsData.pagination.total);
    console.log('   Page:', allPumpsData.pagination.page);
    console.log('   Pumps in this page:', allPumpsData.data.length);
    
    allPumpsData.data.forEach((pump, index) => {
      console.log(`   ${index + 1}. ${pump.nome} (${pump.ragStatus.toUpperCase()})`);
    });
    console.log();

    // Step 6: Get pump statistics
    console.log('6️⃣ Getting pump statistics...');
    const getStatsResponse = await fetch(`${BASE_URL}/api/pumps/stats`, {
      headers: {
        'Cookie': authCookies
      }
    });

    if (!getStatsResponse.ok) {
      throw new Error('Get pump stats failed');
    }

    const statsData = await getStatsResponse.json();
    console.log('✅ Pump statistics retrieved successfully');
    console.log('   Total pumps:', statsData.data.total);
    console.log('   Active pumps:', statsData.data.active);
    console.log('   Inactive pumps:', statsData.data.inactive);
    console.log('   RAG Status breakdown:');
    console.log('     🟢 Normal:', statsData.data.byRAGStatus.normal);
    console.log('     🟡 Attention:', statsData.data.byRAGStatus.atencao);
    console.log('     🔴 Critical:', statsData.data.byRAGStatus.critico);
    console.log('   With active alerts:', statsData.data.withActiveAlerts);
    console.log();

    // Step 7: Get pumps by status
    console.log('7️⃣ Getting active pumps...');
    const getActivePumpsResponse = await fetch(`${BASE_URL}/api/pumps/status/ativo`, {
      headers: {
        'Cookie': authCookies
      }
    });

    if (!getActivePumpsResponse.ok) {
      throw new Error('Get active pumps failed');
    }

    const activePumpsData = await getActivePumpsResponse.json();
    console.log('✅ Active pumps retrieved successfully');
    console.log('   Active pumps count:', activePumpsData.data.length);
    console.log();

    // Step 8: Test search functionality
    console.log('8️⃣ Testing search functionality...');
    const searchResponse = await fetch(`${BASE_URL}/api/pumps?search=CRUD`, {
      headers: {
        'Cookie': authCookies
      }
    });

    if (!searchResponse.ok) {
      throw new Error('Search pumps failed');
    }

    const searchData = await searchResponse.json();
    console.log('✅ Search completed successfully');
    console.log('   Found pumps:', searchData.data.length);
    console.log();

    // Step 9: Delete pump
    console.log('9️⃣ Deleting pump...');
    const deletePumpResponse = await fetch(`${BASE_URL}/api/pumps/${pumpId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': authCookies
      }
    });

    if (!deletePumpResponse.ok) {
      const errorData = await deletePumpResponse.json();
      throw new Error(`Delete pump failed: ${errorData.message}`);
    }

    console.log('✅ Pump deleted successfully (soft delete - status set to inactive)');
    console.log();

    // Step 10: Test permissions - Login as technician
    console.log('🔟 Testing technician permissions...');
    const techLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'joao.silva@neuramaint.com',
        senha: 'tech123'
      }),
      credentials: 'include'
    });

    if (!techLoginResponse.ok) {
      throw new Error('Technician login failed');
    }

    const techCookies = techLoginResponse.headers.get('set-cookie') || '';
    console.log('✅ Technician login successful');

    // Try to create pump as technician (should fail)
    const techCreateResponse = await fetch(`${BASE_URL}/api/pumps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': techCookies
      },
      body: JSON.stringify({
        nome: 'Bomba Unauthorized',
        localizacao: 'Test Location'
      })
    });

    if (techCreateResponse.status === 403) {
      console.log('✅ Technician correctly denied permission to create pumps');
    } else {
      console.log('❌ Technician should not be able to create pumps');
    }

    // Technician should be able to view pumps
    const techViewResponse = await fetch(`${BASE_URL}/api/pumps`, {
      headers: {
        'Cookie': techCookies
      }
    });

    if (techViewResponse.ok) {
      console.log('✅ Technician can view pumps');
    } else {
      console.log('❌ Technician should be able to view pumps');
    }

    console.log();
    console.log('🎉 All pump CRUD tests completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run tests
testPumpCRUD();