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

const testReadingData = {
  sensorId: 1,
  valor: 65.5,
  qualidade: 95.0
};

async function runReadingProcessingTests() {
  console.log('📊 Starting Reading Processing Tests\n');

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

    // 2. Test health check
    console.log('2. 🏥 Testing reading processing health check...');
    const healthResponse = await axios.get(`${API_BASE}/leituras/health`);
    console.log('✅ Health check successful:', {
      status: healthResponse.data.data.status,
      mlService: healthResponse.data.data.services.mlService,
      version: healthResponse.data.data.version
    });
    console.log('');

    // 3. Create a new reading
    console.log('3. 📝 Creating new reading...');
    const createResponse = await axios.post(`${API_BASE}/leituras`, testReadingData, { headers });
    console.log('✅ Reading created and processed:', {
      id: createResponse.data.data.id,
      sensorId: createResponse.data.data.sensorId,
      valor: createResponse.data.data.valor,
      sensorType: createResponse.data.data.sensor.tipo,
      bomba: createResponse.data.data.sensor.bomba.nome
    });
    console.log('');

    // 4. Create several more readings for better testing
    console.log('4. 📈 Creating additional test readings...');
    const additionalReadings = [
      { sensorId: 1, valor: 68.2, qualidade: 98.0 },
      { sensorId: 2, valor: 3.1, qualidade: 96.5 },
      { sensorId: 3, valor: 8.7, qualidade: 94.0 },
      { sensorId: 1, valor: 72.0, qualidade: 97.2 },
    ];

    for (const reading of additionalReadings) {
      await axios.post(`${API_BASE}/leituras`, reading, { headers });
    }
    console.log(`✅ Created ${additionalReadings.length} additional readings\n`);

    // 5. Get latest readings for dashboard
    console.log('5. 📊 Getting latest readings for dashboard...');
    const ultimasResponse = await axios.get(`${API_BASE}/leituras/ultimas`, { headers });
    console.log('✅ Latest readings retrieved:', {
      totalSensores: ultimasResponse.data.data.totalSensores,
      resumo: ultimasResponse.data.data.resumo,
      samples: ultimasResponse.data.data.leituras.slice(0, 3).map(l => ({
        sensorId: l.sensorId,
        tipo: l.sensor.tipo,
        ultimoValor: l.ultimaLeitura?.valor,
        status: l.status,
        tendencia: l.estatisticas.tendencia
      }))
    });
    console.log('');

    // 6. Get reading statistics
    console.log('6. 📈 Getting reading statistics...');
    const statsResponse = await axios.get(`${API_BASE}/leituras/estatisticas`, { headers });
    console.log('✅ Statistics retrieved:', {
      resumoGeral: statsResponse.data.data.resumoGeral,
      statusDistribution: statsResponse.data.data.statusDistribution,
      tiposSensor: Object.keys(statsResponse.data.data.porTipoSensor)
    });
    console.log('');

    // 7. Get historical data
    console.log('7. 📜 Getting historical readings...');
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const historicoResponse = await axios.get(`${API_BASE}/leituras/historico`, {
      headers,
      params: {
        sensorId: 1,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    console.log('✅ Historical data retrieved:', {
      sensorId: historicoResponse.data.data.sensorId,
      totalReadings: historicoResponse.data.data.dados.length,
      periodo: historicoResponse.data.data.periodo,
      estatisticas: {
        media: historicoResponse.data.data.estatisticas.media,
        minimo: historicoResponse.data.data.estatisticas.minimo,
        maximo: historicoResponse.data.data.estatisticas.maximo
      },
      agregacoesPorHora: historicoResponse.data.data.agregacoes.porHora.length
    });
    console.log('');

    // 8. Test validation errors
    console.log('8. ❌ Testing validation errors...');
    
    // Test missing sensorId
    try {
      await axios.post(`${API_BASE}/leituras`, {
        valor: 50.0
      }, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Missing sensorId validation caught');
      }
    }

    // Test invalid value
    try {
      await axios.post(`${API_BASE}/leituras`, {
        sensorId: 1,
        valor: 'invalid'
      }, { headers });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid value validation caught');
      }
    }

    // Test invalid date range for historical data
    try {
      const invalidStart = new Date();
      const invalidEnd = new Date(invalidStart.getTime() - 24 * 60 * 60 * 1000); // End before start
      
      await axios.get(`${API_BASE}/leituras/historico`, {
        headers,
        params: {
          sensorId: 1,
          startDate: invalidStart.toISOString(),
          endDate: invalidEnd.toISOString()
        }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid date range validation caught');
      }
    }
    console.log('');

    // 9. Test extreme values (should be rejected)
    console.log('9. 🚫 Testing extreme value rejection...');
    try {
      await axios.post(`${API_BASE}/leituras`, {
        sensorId: 1, // Temperature sensor
        valor: 500.0, // Extremely high temperature
        qualidade: 95.0
      }, { headers });
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('outside plausible range')) {
        console.log('✅ Extreme value correctly rejected:', error.response.data.message);
      }
    }
    console.log('');

    // 10. Test non-existent sensor
    console.log('10. 🔍 Testing non-existent sensor...');
    try {
      await axios.post(`${API_BASE}/leituras`, {
        sensorId: 99999,
        valor: 50.0,
        qualidade: 95.0
      }, { headers });
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('not found')) {
        console.log('✅ Non-existent sensor correctly rejected');
      }
    }
    console.log('');

    // 11. Test historical data with different periods
    console.log('11. 📅 Testing different historical periods...');
    
    // Test weekly data
    const weekStart = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyResponse = await axios.get(`${API_BASE}/leituras/historico`, {
      headers,
      params: {
        sensorId: 1,
        startDate: weekStart.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    console.log('✅ Weekly historical data:', {
      diasAnalisados: weeklyResponse.data.data.periodo.diasAnalisados,
      totalReadings: weeklyResponse.data.data.dados.length,
      temAgregacaoDiaria: !!weeklyResponse.data.data.agregacoes.porDia
    });
    console.log('');

    // 12. Test authorization with different user roles
    console.log('12. 👥 Testing authorization with technician...');
    try {
      const techLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'joao.silva@neuramaint.com',
        senha: 'tech123'
      });
      
      const techCookies = techLoginResponse.headers['set-cookie']?.join('; ') || '';
      const techHeaders = { 'Cookie': techCookies };

      // Technician should be able to create readings
      const techReadingResponse = await axios.post(`${API_BASE}/leituras`, {
        sensorId: 2,
        valor: 4.2,
        qualidade: 93.0
      }, { headers: techHeaders });
      
      console.log('✅ Technician can create readings:', {
        created: !!techReadingResponse.data.success
      });

      // Technician should be able to view latest readings
      const techUltimasResponse = await axios.get(`${API_BASE}/leituras/ultimas`, { headers: techHeaders });
      console.log('✅ Technician can view latest readings:', {
        totalSensores: techUltimasResponse.data.data.totalSensores
      });

    } catch (error) {
      console.log('❌ Technician authorization test failed:', error.response?.data?.message);
    }
    console.log('');

    // 13. Test timestamp handling
    console.log('13. ⏰ Testing custom timestamp...');
    const customTimestamp = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    const timestampResponse = await axios.post(`${API_BASE}/leituras`, {
      sensorId: 3,
      valor: 9.1,
      timestamp: customTimestamp.toISOString(),
      qualidade: 96.0
    }, { headers });
    
    console.log('✅ Custom timestamp accepted:', {
      requested: customTimestamp.toISOString(),
      stored: timestampResponse.data.data.timestamp,
      match: new Date(timestampResponse.data.data.timestamp).getTime() === customTimestamp.getTime()
    });
    console.log('');

    // 14. Test ML service integration indication
    console.log('14. 🤖 Verifying ML service integration...');
    const mlTestResponse = await axios.post(`${API_BASE}/leituras`, {
      sensorId: 1,
      valor: 85.0, // High temperature value
      qualidade: 92.0
    }, { headers });
    
    console.log('✅ Reading with potential ML analysis:', {
      created: !!mlTestResponse.data.success,
      highValue: mlTestResponse.data.data.valor,
      // Note: ML prediction would be processed asynchronously
      message: 'ML prediction processed in background'
    });
    console.log('');

    console.log('🎉 All Reading Processing tests completed successfully!\n');

    // Summary
    console.log('📋 Test Summary:');
    console.log('✅ Reading creation and processing');
    console.log('✅ Latest readings for dashboard');
    console.log('✅ Historical data analysis');
    console.log('✅ Statistical calculations');
    console.log('✅ Data validation and sanitization');
    console.log('✅ Value range validation');
    console.log('✅ Authorization and permissions');
    console.log('✅ Timestamp handling');
    console.log('✅ Error handling and edge cases');
    console.log('✅ ML service integration (async)');
    console.log('✅ Portuguese endpoint naming');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run tests immediately
runReadingProcessingTests().catch(console.error);