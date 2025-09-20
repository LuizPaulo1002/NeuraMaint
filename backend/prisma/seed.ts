import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@neuramaint.com' },
    update: {},
    create: {
      nome: 'Administrador Sistema',
      email: 'admin@neuramaint.com',
      senha: adminPassword,
      papel: 'admin',
      ativo: true,
    },
  });

  // Create technician user
  const techPassword = await bcrypt.hash('tech123', 12);
  const tecnico = await prisma.usuario.upsert({
    where: { email: 'joao.silva@neuramaint.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'joao.silva@neuramaint.com',
      senha: techPassword,
      papel: 'tecnico',
      ativo: true,
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const gestor = await prisma.usuario.upsert({
    where: { email: 'maria.santos@neuramaint.com' },
    update: {},
    create: {
      nome: 'Maria Santos',
      email: 'maria.santos@neuramaint.com',
      senha: managerPassword,
      papel: 'gestor',
      ativo: true,
    },
  });

  console.log('✅ Users created:', { admin: admin.id, tecnico: tecnico.id, gestor: gestor.id });

  // Create pumps
  const bomba1 = await prisma.bomba.create({
    data: {
      nome: 'Bomba Centrífuga 01',
      modelo: 'BC-500',
      localizacao: 'Setor A - Linha de Produção 1',
      status: 'ativo',
      capacidade: 500.0,
      potencia: 15.0,
      anoFabricacao: 2020,
      dataInstalacao: new Date('2020-03-15'),
      proximaManutencao: new Date('2024-12-01'),
      observacoes: 'Bomba principal da linha de produção',
      usuarioId: tecnico.id,
    },
  });

  const bomba2 = await prisma.bomba.create({
    data: {
      nome: 'Bomba Centrífuga 02',
      modelo: 'BC-300',
      localizacao: 'Setor B - Linha de Produção 2',
      status: 'ativo',
      capacidade: 300.0,
      potencia: 10.0,
      anoFabricacao: 2019,
      dataInstalacao: new Date('2019-08-20'),
      proximaManutencao: new Date('2024-11-15'),
      observacoes: 'Bomba secundária, operação contínua',
      usuarioId: tecnico.id,
    },
  });

  const bomba3 = await prisma.bomba.create({
    data: {
      nome: 'Bomba de Recirculação 03',
      modelo: 'BR-200',
      localizacao: 'Setor C - Sistema de Resfriamento',
      status: 'ativo',
      capacidade: 200.0,
      potencia: 7.5,
      anoFabricacao: 2021,
      dataInstalacao: new Date('2021-01-10'),
      proximaManutencao: new Date('2024-10-30'),
      observacoes: 'Sistema de resfriamento crítico',
      usuarioId: tecnico.id,
    },
  });

  console.log('✅ Pumps created:', { bomba1: bomba1.id, bomba2: bomba2.id, bomba3: bomba3.id });

  // Create sensors for each pump
  const sensoresBomba1 = await Promise.all([
    prisma.sensor.create({
      data: {
        tipo: 'temperatura',
        unidade: '°C',
        descricao: 'Sensor de temperatura do motor',
        valorMinimo: 20.0,
        valorMaximo: 80.0,
        bombaId: bomba1.id,
      },
    }),
    prisma.sensor.create({
      data: {
        tipo: 'vibracao',
        unidade: 'mm/s',
        descricao: 'Sensor de vibração do eixo',
        valorMinimo: 0.0,
        valorMaximo: 10.0,
        bombaId: bomba1.id,
      },
    }),
    prisma.sensor.create({
      data: {
        tipo: 'pressao',
        unidade: 'bar',
        descricao: 'Sensor de pressão de saída',
        valorMinimo: 0.0,
        valorMaximo: 25.0,
        bombaId: bomba1.id,
      },
    }),
  ]);

  const sensoresBomba2 = await Promise.all([
    prisma.sensor.create({
      data: {
        tipo: 'temperatura',
        unidade: '°C',
        descricao: 'Sensor de temperatura do motor',
        valorMinimo: 20.0,
        valorMaximo: 80.0,
        bombaId: bomba2.id,
      },
    }),
    prisma.sensor.create({
      data: {
        tipo: 'vibracao',
        unidade: 'mm/s',
        descricao: 'Sensor de vibração do eixo',
        valorMinimo: 0.0,
        valorMaximo: 10.0,
        bombaId: bomba2.id,
      },
    }),
    prisma.sensor.create({
      data: {
        tipo: 'rotacao',
        unidade: 'rpm',
        descricao: 'Sensor de rotação do motor',
        valorMinimo: 0.0,
        valorMaximo: 3600.0,
        bombaId: bomba2.id,
      },
    }),
  ]);

  const sensoresBomba3 = await Promise.all([
    prisma.sensor.create({
      data: {
        tipo: 'temperatura',
        unidade: '°C',
        descricao: 'Sensor de temperatura do motor',
        valorMinimo: 20.0,
        valorMaximo: 70.0,
        bombaId: bomba3.id,
      },
    }),
    prisma.sensor.create({
      data: {
        tipo: 'fluxo',
        unidade: 'm³/h',
        descricao: 'Sensor de fluxo de saída',
        valorMinimo: 0.0,
        valorMaximo: 100.0,
        bombaId: bomba3.id,
      },
    }),
  ]);

  console.log('✅ Sensors created for all pumps');

  // Create sample readings for the last 24 hours
  const now = new Date();
  const sensores = [...sensoresBomba1, ...sensoresBomba2, ...sensoresBomba3];

  for (const sensor of sensores) {
    const leituras = [];
    
    // Generate readings for last 24 hours (every 5 minutes = 288 readings)
    for (let i = 288; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
      let valor = 0;

      // Generate realistic values based on sensor type
      switch (sensor.tipo) {
        case 'temperatura':
          valor = 45 + Math.random() * 20 + Math.sin(i / 20) * 5; // 45-70°C with variation
          break;
        case 'vibracao':
          valor = 2 + Math.random() * 3 + Math.sin(i / 15) * 1; // 2-6 mm/s with variation
          break;
        case 'pressao':
          valor = 15 + Math.random() * 5 + Math.sin(i / 25) * 2; // 15-22 bar with variation
          break;
        case 'rotacao':
          valor = 1750 + Math.random() * 100 + Math.sin(i / 30) * 50; // 1700-1900 rpm
          break;
        case 'fluxo':
          valor = 80 + Math.random() * 15 + Math.sin(i / 35) * 5; // 75-100 m³/h
          break;
      }

      leituras.push({
        valor: Math.round(valor * 100) / 100, // Round to 2 decimal places
        timestamp,
        qualidade: 95 + Math.random() * 5, // 95-100% quality
        sensorId: sensor.id,
      });
    }

    await prisma.leitura.createMany({
      data: leituras,
    });
  }

  console.log('✅ Sample readings created for all sensors');

  // Create some alerts
  const alertas = await Promise.all([
    prisma.alerta.create({
      data: {
        tipo: 'Temperatura Alta',
        mensagem: 'Temperatura do motor da Bomba 01 excedeu 75°C',
        nivel: 'atencao',
        status: 'resolvido',
        valor: 76.5,
        threshold: 75.0,
        acaoTomada: 'Verificação do sistema de resfriamento realizada',
        resolvidoPor: tecnico.id,
        resolvidoEm: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        bombaId: bomba1.id,
      },
    }),
    prisma.alerta.create({
      data: {
        tipo: 'Vibração Excessiva',
        mensagem: 'Vibração da Bomba 02 está acima do normal',
        nivel: 'critico',
        status: 'pendente',
        valor: 8.2,
        threshold: 7.0,
        bombaId: bomba2.id,
      },
    }),
    prisma.alerta.create({
      data: {
        tipo: 'Fluxo Reduzido',
        mensagem: 'Fluxo da Bomba 03 está abaixo do esperado',
        nivel: 'atencao',
        status: 'pendente',
        valor: 65.0,
        threshold: 70.0,
        bombaId: bomba3.id,
      },
    }),
  ]);

  console.log('✅ Alerts created:', alertas.length);

  // Create maintenance records
  const manutencoes = await Promise.all([
    prisma.manutencao.create({
      data: {
        tipo: 'Preventiva',
        descricao: 'Troca de óleo e verificação geral',
        dataInicio: new Date('2024-01-15T08:00:00'),
        dataFim: new Date('2024-01-15T12:00:00'),
        custo: 850.00,
        responsavel: 'João Silva',
        observacoes: 'Manutenção realizada conforme cronograma',
        pecasUtilizadas: JSON.stringify({
          items: [
            { nome: 'Óleo lubrificante', quantidade: 1, unidade: 'litro' },
            { nome: 'Filtro de óleo', quantidade: 1, unidade: 'peça' }
          ]
        }),
        bombaId: bomba1.id,
      },
    }),
    prisma.manutencao.create({
      data: {
        tipo: 'Corretiva',
        descricao: 'Substituição de rolamento danificado',
        dataInicio: new Date('2024-02-20T14:00:00'),
        dataFim: new Date('2024-02-20T18:00:00'),
        custo: 1250.00,
        responsavel: 'João Silva',
        observacoes: 'Rolamento apresentava sinais de desgaste excessivo',
        pecasUtilizadas: JSON.stringify({
          items: [
            { nome: 'Rolamento SKF 6208', quantidade: 1, unidade: 'peça' },
            { nome: 'Graxa especial', quantidade: 0.5, unidade: 'kg' }
          ]
        }),
        bombaId: bomba2.id,
      },
    }),
  ]);

  console.log('✅ Maintenance records created:', manutencoes.length);

  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📝 Default users created:');
  console.log('   Admin: admin@neuramaint.com / admin123');
  console.log('   Technician: joao.silva@neuramaint.com / tech123');
  console.log('   Manager: maria.santos@neuramaint.com / manager123');
  console.log('');
  console.log('🏭 Equipment created:');
  console.log('   - 3 industrial pumps');
  console.log('   - 8 sensors (temperature, vibration, pressure, rotation, flow)');
  console.log('   - 24h of sample sensor data');
  console.log('   - 3 sample alerts');
  console.log('   - 2 maintenance records');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });