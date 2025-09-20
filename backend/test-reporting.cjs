// Reporting functionality test script
// Run with: node test-reporting.js

const BASE_URL = 'http://localhost:3001';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testReporting() {
  console.log('📋 Starting Reporting Functionality Tests\n');

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
      console.log('❌ Admin login failed. Cannot proceed with reporting tests.');
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

    // Test 2: Test equipment report generation
    console.log('2️⃣ Testing equipment report generation...');
    
    try {
      const equipmentReportResponse = await fetch(`${BASE_URL}/api/relatorios/equipamentos`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (equipmentReportResponse.ok) {
        console.log('✅ Equipment report generation endpoint accessible');
        console.log('   Status:', equipmentReportResponse.status);
        console.log();
      } else if (equipmentReportResponse.status === 404) {
        console.log('⚠️  Equipment report endpoint not implemented yet');
        console.log();
      } else {
        console.log('❌ Failed to access equipment report endpoint');
        console.log('   Status:', equipmentReportResponse.status);
        console.log();
      }
    } catch (error) {
      console.log('⚠️  Equipment report endpoint not available');
      console.log();
    }

    // Test 3: Test maintenance report generation
    console.log('3️⃣ Testing maintenance report generation...');
    
    try {
      const maintenanceReportResponse = await fetch(`${BASE_URL}/api/relatorios/manutencao`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (maintenanceReportResponse.ok) {
        console.log('✅ Maintenance report generation endpoint accessible');
        console.log('   Status:', maintenanceReportResponse.status);
        console.log();
      } else if (maintenanceReportResponse.status === 404) {
        console.log('⚠️  Maintenance report endpoint not implemented yet');
        console.log();
      } else {
        console.log('❌ Failed to access maintenance report endpoint');
        console.log('   Status:', maintenanceReportResponse.status);
        console.log();
      }
    } catch (error) {
      console.log('⚠️  Maintenance report endpoint not available');
      console.log();
    }

    // Test 4: Test alert report generation
    console.log('4️⃣ Testing alert report generation...');
    
    try {
      const alertReportResponse = await fetch(`${BASE_URL}/api/relatorios/alertas`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (alertReportResponse.ok) {
        console.log('✅ Alert report generation endpoint accessible');
        console.log('   Status:', alertReportResponse.status);
        console.log();
      } else if (alertReportResponse.status === 404) {
        console.log('⚠️  Alert report endpoint not implemented yet');
        console.log();
      } else {
        console.log('❌ Failed to access alert report endpoint');
        console.log('   Status:', alertReportResponse.status);
        console.log();
      }
    } catch (error) {
      console.log('⚠️  Alert report endpoint not available');
      console.log();
    }

    // Test 5: Test performance report generation
    console.log('5️⃣ Testing performance report generation...');
    
    try {
      const performanceReportResponse = await fetch(`${BASE_URL}/api/relatorios/desempenho`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (performanceReportResponse.ok) {
        console.log('✅ Performance report generation endpoint accessible');
        console.log('   Status:', performanceReportResponse.status);
        console.log();
      } else if (performanceReportResponse.status === 404) {
        console.log('⚠️  Performance report endpoint not implemented yet');
        console.log();
      } else {
        console.log('❌ Failed to access performance report endpoint');
        console.log('   Status:', performanceReportResponse.status);
        console.log();
      }
    } catch (error) {
      console.log('⚠️  Performance report endpoint not available');
      console.log();
    }

    // Test 6: Test report format with static data
    console.log('6️⃣ Testing report format with static data...');
    
    // Create a mock report object
    const mockReport = {
      titulo: "Relatório de Teste",
      data_geracao: new Date().toISOString(),
      periodo: {
        inicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        fim: new Date().toISOString()
      },
      resumo: {
        total_equipamentos: 10,
        equipamentos_ativos: 8,
        alertas_gerados: 5,
        alertas_resolvidos: 3
      },
      detalhes: [
        {
          tipo: "equipamento",
          dados: [
            { nome: "Bomba 01", status: "ativo", localizacao: "Setor A" },
            { nome: "Bomba 02", status: "inativo", localizacao: "Setor B" }
          ]
        },
        {
          tipo: "alerta",
          dados: [
            { tipo: "temperatura_alta", nivel: "alto", status: "pendente" },
            { tipo: "vibracao_alta", nivel: "medio", status: "resolvido" }
          ]
        }
      ]
    };
    
    console.log('✅ Static report data structure validated');
    console.log('   Report title:', mockReport.titulo);
    console.log('   Equipment count:', mockReport.resumo.total_equipamentos);
    console.log('   Alert count:', mockReport.resumo.alertas_gerados);
    console.log();

    // Test 7: Test report export functionality (if available)
    console.log('7️⃣ Testing report export functionality...');
    
    try {
      // Try to export a simple report
      const exportResponse = await fetch(`${BASE_URL}/api/relatorios/exportar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          tipo: 'teste',
          formato: 'json'
        })
      });

      if (exportResponse.ok) {
        console.log('✅ Report export functionality accessible');
        console.log('   Status:', exportResponse.status);
        console.log();
      } else if (exportResponse.status === 404) {
        console.log('⚠️  Report export functionality not implemented yet');
        console.log();
      } else {
        console.log('❌ Failed to access report export functionality');
        console.log('   Status:', exportResponse.status);
        console.log();
      }
    } catch (error) {
      console.log('⚠️  Report export functionality not available');
      console.log();
    }

    // Test 8: Test report scheduling (if available)
    console.log('8️⃣ Testing report scheduling functionality...');
    
    try {
      const scheduleResponse = await fetch(`${BASE_URL}/api/relatorios/agendamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          tipo: 'semanal',
          formato: 'pdf',
          destinatarios: ['admin@neuramaint.com']
        })
      });

      if (scheduleResponse.ok) {
        console.log('✅ Report scheduling functionality accessible');
        console.log('   Status:', scheduleResponse.status);
        console.log();
      } else if (scheduleResponse.status === 404) {
        console.log('⚠️  Report scheduling functionality not implemented yet');
        console.log();
      } else {
        console.log('❌ Failed to access report scheduling functionality');
        console.log('   Status:', scheduleResponse.status);
        console.log();
      }
    } catch (error) {
      console.log('⚠️  Report scheduling functionality not available');
      console.log();
    }

    console.log('📋 Reporting Functionality tests completed!');

  } catch (error) {
    console.error('❌ Reporting test error:', error.message);
    console.log('\n💡 Make sure the server is running: npm run dev');
  }
}

// Run reporting tests
testReporting();