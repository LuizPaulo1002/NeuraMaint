// Test Data Generation Script
// Run with: node generate-test-data.js

const fs = require('fs');
const path = require('path');

// Generate test users
function generateTestUsers(count = 10) {
  const roles = ['admin', 'gestor', 'tecnico'];
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    users.push({
      id: i,
      nome: `Test User ${i}`,
      email: `test${i}@example.com`,
      papel: role,
      ativo: true,
      senha: '$2a$12$exampleHash' // Placeholder hash
    });
  }
  
  return users;
}

// Generate test pumps
function generateTestPumps(count = 20) {
  const models = ['MODEL-A', 'MODEL-B', 'MODEL-C', 'MODEL-D', 'MODEL-E'];
  const locations = ['Area A', 'Area B', 'Area C', 'Area D', 'Area E'];
  const statuses = ['ativo', 'inativo', 'manutencao'];
  const pumps = [];
  
  for (let i = 1; i <= count; i++) {
    pumps.push({
      id: i,
      nome: `Pump ${i.toString().padStart(3, '0')}`,
      modelo: models[Math.floor(Math.random() * models.length)],
      localizacao: locations[Math.floor(Math.random() * locations.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      capacidade: Math.floor(Math.random() * 1000) + 100,
      potencia: Math.floor(Math.random() * 50) + 5,
      anoFabricacao: Math.floor(Math.random() * 20) + 2000,
      dataInstalacao: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
      proximaManutencao: new Date(Date.now() + Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)),
      usuarioId: Math.floor(Math.random() * 10) + 1
    });
  }
  
  return pumps;
}

// Generate test sensors
function generateTestSensors(pumpCount = 20) {
  const types = ['temperatura', 'vibracao', 'pressao', 'fluxo', 'rotacao'];
  const units = ['°C', 'mm/s', 'bar', 'L/min', 'RPM'];
  const sensors = [];
  let sensorId = 1;
  
  for (let pumpId = 1; pumpId <= pumpCount; pumpId++) {
    // Each pump gets 3-5 sensors
    const sensorCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < sensorCount; i++) {
      const typeIndex = Math.floor(Math.random() * types.length);
      sensors.push({
        id: sensorId++,
        tipo: types[typeIndex],
        unidade: units[typeIndex],
        descricao: `Sensor de ${types[typeIndex]} para Bomba ${pumpId.toString().padStart(3, '0')}`,
        valorMinimo: 0,
        valorMaximo: typeIndex === 0 ? 100 : typeIndex === 1 ? 10 : typeIndex === 2 ? 15 : typeIndex === 3 ? 300 : 4000,
        bombaId: pumpId
      });
    }
  }
  
  return sensors;
}

// Generate test readings
function generateTestReadings(sensorCount = 100, readingsPerSensor = 50) {
  const readings = [];
  const now = Date.now();
  
  for (let sensorId = 1; sensorId <= sensorCount; sensorId++) {
    // Generate readings for the last 24 hours
    for (let i = 0; i < readingsPerSensor; i++) {
      const timestamp = new Date(now - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
      
      // Generate realistic values based on sensor type
      let valor;
      switch (sensorId % 5) {
        case 0: // Temperature
          valor = Math.random() * 80 + 20; // 20-100°C
          break;
        case 1: // Vibration
          valor = Math.random() * 5; // 0-5 mm/s
          break;
        case 2: // Pressure
          valor = Math.random() * 10; // 0-10 bar
          break;
        case 3: // Flow
          valor = Math.random() * 200 + 50; // 50-250 L/min
          break;
        case 4: // Rotation
          valor = Math.random() * 1500 + 1500; // 1500-3000 RPM
          break;
        default:
          valor = Math.random() * 100;
      }
      
      readings.push({
        id: (sensorId - 1) * readingsPerSensor + i + 1,
        sensorId: sensorId,
        valor: Math.round(valor * 100) / 100,
        timestamp: timestamp,
        qualidade: Math.floor(Math.random() * 20) + 80 // 80-100 quality
      });
    }
  }
  
  return readings;
}

// Generate test alerts
function generateTestAlerts(pumpCount = 20, alertCount = 50) {
  const types = ['temperatura_alta', 'vibracao_alta', 'pressao_baixa', 'fluxo_anormal', 'rotacao_irregular'];
  const levels = ['normal', 'atencao', 'critico'];
  const statuses = ['pendente', 'resolvido', 'cancelado'];
  const alerts = [];
  
  for (let i = 1; i <= alertCount; i++) {
    const pumpId = Math.floor(Math.random() * pumpCount) + 1;
    const type = types[Math.floor(Math.random() * types.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    alerts.push({
      id: i,
      bombaId: pumpId,
      tipo: type,
      nivel: level,
      status: status,
      mensagem: `Alerta de ${type} na bomba ${pumpId.toString().padStart(3, '0')} - Nível: ${level}`,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      resolvidoEm: status === 'resolvido' ? new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)) : null,
      resolvidoPor: status === 'resolvido' ? Math.floor(Math.random() * 10) + 1 : null
    });
  }
  
  return alerts;
}

// Main function to generate all test data
function generateAllTestData() {
  console.log('🔧 Generating Test Data');
  console.log('=====================');
  
  // Create test data directory
  const testDataDir = path.join(__dirname, '../test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  // Generate users
  console.log('Generating test users...');
  const users = generateTestUsers(20);
  fs.writeFileSync(path.join(testDataDir, 'users.json'), JSON.stringify(users, null, 2));
  
  // Generate pumps
  console.log('Generating test pumps...');
  const pumps = generateTestPumps(30);
  fs.writeFileSync(path.join(testDataDir, 'pumps.json'), JSON.stringify(pumps, null, 2));
  
  // Generate sensors
  console.log('Generating test sensors...');
  const sensors = generateTestSensors(30);
  fs.writeFileSync(path.join(testDataDir, 'sensors.json'), JSON.stringify(sensors, null, 2));
  
  // Generate readings
  console.log('Generating test readings...');
  const readings = generateTestReadings(150, 100);
  fs.writeFileSync(path.join(testDataDir, 'readings.json'), JSON.stringify(readings, null, 2));
  
  // Generate alerts
  console.log('Generating test alerts...');
  const alerts = generateTestAlerts(30, 100);
  fs.writeFileSync(path.join(testDataDir, 'alerts.json'), JSON.stringify(alerts, null, 2));
  
  console.log('\n✅ Test data generation completed!');
  console.log(`📁 Test data saved to: ${testDataDir}`);
  console.log('\n📊 Generated data summary:');
  console.log(`   👤 Users: ${users.length}`);
  console.log(`   🎛️  Pumps: ${pumps.length}`);
  console.log(`   📡 Sensors: ${sensors.length}`);
  console.log(`   📈 Readings: ${readings.length}`);
  console.log(`   🚨 Alerts: ${alerts.length}`);
}

// Run the data generation
generateAllTestData();