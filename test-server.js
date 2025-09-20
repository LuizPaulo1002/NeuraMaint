const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'connected',
    timestamp: new Date().toISOString(),
    database: 'test-mode',
    message: 'Test server running without database'
  });
});

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock users for testing
  const mockUsers = [
    { 
      email: 'admin@neuramaint.com', 
      password: 'admin123', 
      role: 'admin',
      nome: 'Administrador Sistema',
      id: 1
    },
    { 
      email: 'joao.silva@neuramaint.com', 
      password: 'tech123', 
      role: 'tecnico',
      nome: 'João Silva',
      id: 2
    },
    { 
      email: 'maria.santos@neuramaint.com', 
      password: 'manager123', 
      role: 'gestor',
      nome: 'Maria Santos',
      id: 3
    }
  ];
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Mock JWT token
    const token = `mock.jwt.token.${user.id}`;
    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.role
      }
    });
  } else {
    res.status(401).json({
      message: 'Credenciais inválidas'
    });
  }
});

// Mock pumps endpoint
app.get('/api/pumps', (req, res) => {
  res.json([
    {
      id: 1,
      nome: 'Bomba Centrífuga 01',
      modelo: 'BC-500',
      localizacao: 'Setor A - Linha de Produção 1',
      status: 'ativo'
    },
    {
      id: 2,
      nome: 'Bomba Centrífuga 02',
      modelo: 'BC-300',
      localizacao: 'Setor B - Linha de Produção 2',
      status: 'ativo'
    }
  ]);
});

// Mock dashboard data
app.get('/api/dashboard/overview', (req, res) => {
  res.json({
    totalPumps: 3,
    activePumps: 3,
    criticalAlerts: 1,
    pendingAlerts: 2,
    systemHealth: 'warning'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('📚 Health check: /health');
  console.log('🔐 Auth endpoint: /api/auth/login');
  console.log('🏭 Mock APIs available');
});

module.exports = app;