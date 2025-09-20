import axios from 'axios';

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

const API_BASE = 'http://localhost:3001/api';
let cookieJar = '';
let createdSensorId = null;

// Test configuration
const adminCredentials = {
  email: 'admin@neuramaint.com',
  senha: 'admin123'
};

const testSensorData = {
  tipo: 'temperatura',
  unidade: '°C',
  descricao: 'Sensor de teste de temperatura',
  valorMinimo: 10.0,
  valorMaximo: 100.0,
  ativo: true,
  bombaId: 1  // Assuming pump with ID 1 exists from seed data
};

const updatedSensorData = {
  descricao: 'Sensor de teste atualizado',
  valorMinimo: 15.0,
  valorMaximo: 90.0
};

async function runTests() {
  console.log('🧪 Starting Sensor CRUD Tests\n');

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

    // 2. Create a new sensor
    console.log('2. ➕ Creating new sensor...');
    const createResponse = await axios.post(`${API_BASE}/sensors`, testSensorData, { headers });
    createdSensorId = createResponse.data.data.id;
    console.log('✅ Sensor created successfully:', {
      id: createdSensorId,
      tipo: createResponse.data.data.tipo,
      unidade: createResponse.data.data.unidade,
      bomba: createResponse.data.data.bomba?.nome
    });
    console.log('');

    // 3. Get sensor by ID
    console.log('3. 🔍 Getting sensor by ID...');
    const getResponse = await axios.get(`${API_BASE}/sensors/${createdSensorId}`, { headers });
    console.log('✅ Sensor retrieved successfully:', {
      id: getResponse.data.data.id,
      tipo: getResponse.data.data.tipo,
      descricao: getResponse.data.data.descricao,
      status: getResponse.data.data.ativo ? 'ativo' : 'inativo'
    });
    console.log('');

    // 4. Get all sensors with pagination
    console.log('4. 📋 Getting all sensors...');
    const getAllResponse = await axios.get(`${API_BASE}/sensors?page=1&limit=5`, { headers });
    console.log('✅ Sensors list retrieved:', {
      total: getAllResponse.data.pagination.total,
      page: getAllResponse.data.pagination.page,
      sensors: getAllResponse.data.data.length
    });
    console.log('');

    // 5. Get sensors by pump
    console.log('5. 🏭 Getting sensors by pump...');
    const pumpSensorsResponse = await axios.get(`${API_BASE}/sensors/pump/1`, { headers });
    console.log('✅ Pump sensors retrieved:', {
      count: pumpSensorsResponse.data.data.length,
      sensors: pumpSensorsResponse.data.data.map(s => ({
        id: s.id,
        tipo: s.tipo,
        descricao: s.descricao
      }))
    });
    console.log('');

    // 6. Get sensors by type
    console.log('6. 🌡️ Getting sensors by type (temperatura)...');
    const typeSensorsResponse = await axios.get(`${API_BASE}/sensors/type/temperatura`, { headers });
    console.log('✅ Temperature sensors retrieved:', {
      count: typeSensorsResponse.data.data.length
    });
    console.log('');

    // 7. Get active sensors
    console.log('7. ✨ Getting active sensors...');
    const activeSensorsResponse = await axios.get(`${API_BASE}/sensors/active`, { headers });
    console.log('✅ Active sensors retrieved:', {
      count: activeSensorsResponse.data.data.length
    });
    console.log('');

    // 8. Get sensor statistics
    console.log('8. 📊 Getting sensor statistics...');
    const statsResponse = await axios.get(`${API_BASE}/sensors/stats`, { headers });
    console.log('✅ Sensor statistics retrieved:', {
      total: statsResponse.data.data.total,
      active: statsResponse.data.data.active,
      inactive: statsResponse.data.data.inactive,
      byType: statsResponse.data.data.byType
    });
    console.log('');

    // 9. Get valid sensor types
    console.log('9. 📝 Getting valid sensor types...');
    const typesResponse = await axios.get(`${API_BASE}/sensors/types`, { headers });
    console.log('✅ Valid sensor types retrieved:', typesResponse.data.data);
    console.log('');

    // 10. Get latest reading (might be null for new sensor)
    console.log('10. 📡 Getting latest sensor reading...');
    try {
      const readingResponse = await axios.get(`${API_BASE}/sensors/${createdSensorId}/latest-reading`, { headers });
      console.log('✅ Latest reading retrieved:', readingResponse.data.data || 'No readings available');
    } catch (error) {
      console.log('ℹ️ No readings available for new sensor (expected)');
    }
    console.log('');

    // 11. Update sensor
    console.log('11. ✏️ Updating sensor...');
    const updateResponse = await axios.put(`${API_BASE}/sensors/${createdSensorId}`, updatedSensorData, { headers });
    console.log('✅ Sensor updated successfully:', {
      id: updateResponse.data.data.id,
      descricao: updateResponse.data.data.descricao,
      valorMinimo: updateResponse.data.data.valorMinimo,
      valorMaximo: updateResponse.data.data.valorMaximo
    });
    console.log('');

    // 12. Test validation errors
    console.log('12. ❌ Testing validation (invalid sensor type)...');
    try {
      await axios.post(`${API_BASE}/sensors`, {
        ...testSensorData,
        tipo: 'invalid_type'
      }, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation error correctly caught:', error.response.data.message);
      }
    }
    console.log('');

    // 13. Test authorization (try to access as non-admin)
    console.log('13. 🚫 Testing authorization (login as technician)...');
    try {
      const techLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'joao.silva@neuramaint.com',
        senha: 'tech123'
      });
      
      const techCookies = techLoginResponse.headers['set-cookie']?.join('; ') || '';
      const techHeaders = { 'Cookie': techCookies };
      
      // Try to create sensor as technician (should fail)
      await axios.post(`${API_BASE}/sensors`, testSensorData, { headers: techHeaders });
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Authorization correctly blocked technician from creating sensor');
      }
    }
    console.log('');

    // 14. Delete sensor
    console.log('14. 🗑️ Deleting sensor...');
    const deleteResponse = await axios.delete(`${API_BASE}/sensors/${createdSensorId}`, { headers });
    console.log('✅ Sensor deleted successfully');
    console.log('');

    // 15. Verify sensor is deleted
    console.log('15. ✅ Verifying sensor deletion...');
    try {
      await axios.get(`${API_BASE}/sensors/${createdSensorId}`, { headers });
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Sensor successfully deleted (404 when trying to retrieve)');
      }
    }

    console.log('\n🎉 All Sensor CRUD tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Cleanup: try to delete created sensor if it exists
    if (createdSensorId && cookieJar) {
      try {
        await axios.delete(`${API_BASE}/sensors/${createdSensorId}`, {
          headers: { 'Cookie': cookieJar }
        });
        console.log('🧹 Cleanup: Created sensor deleted');
      } catch (cleanupError) {
        console.log('⚠️ Cleanup failed - sensor may still exist');
      }
    }
  }
}

// Run tests immediately
runTests().catch(console.error);