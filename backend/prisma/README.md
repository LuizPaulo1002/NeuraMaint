# NeuraMaint Database Setup

This directory contains the Prisma database configuration for the NeuraMaint industrial maintenance system.

## 📊 Database Schema Overview

The database implements a comprehensive industrial equipment monitoring system with the following entities:

### Core Entities

| Entity | Description | Key Features |
|--------|-------------|--------------|
| **Usuario** | System users (admin/tecnico/gestor) | Role-based access control |
| **Bomba** | Industrial pumps | Equipment management with status tracking |
| **Sensor** | Equipment sensors | Multi-type sensor support (temperature, vibration, pressure, flow, rotation) |
| **Leitura** | Sensor readings | Time-series data with quality metrics |
| **Predicao** | ML predictions | Failure probability and recommendations |
| **Alerta** | System alerts | RAG status alerts with resolution tracking |
| **Manutencao** | Maintenance records | Complete maintenance history |

### Relationships

```
Usuario (1) ──── (N) Bomba (1) ──── (N) Sensor (1) ──── (N) Leitura (1) ──── (1) Predicao
   │                   │
   │                   └──── (N) Alerta
   │                   │
   │                   └──── (N) Manutencao
   │
   └── (N) Alerta (resolved_by)
```

## 🛠 Setup Instructions

### Prerequisites

- PostgreSQL 12+ running locally or accessible via URL
- Node.js 18+ 
- npm or yarn package manager

### 1. Environment Configuration

Create or update the `.env` file in the backend directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"

# Example for local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/neuramaint_dev?schema=public"

# Example for ElephantSQL (recommended for development)
DATABASE_URL="postgresql://username:password@raja.db.elephantsql.com:5432/database"
```

### 2. Database Setup Commands

```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Seed the database with sample data
npm run prisma:seed

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### 3. Database Reset (Development)

```bash
# Reset database and reseed (⚠️ This will delete all data!)
npm run db:reset
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create and apply new migration |
| `npm run prisma:deploy` | Apply migrations (production) |
| `npm run prisma:seed` | Populate database with sample data |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database and reseed |

## 🌱 Sample Data

The seed script creates:

### Users
- **Admin**: `admin@neuramaint.com` / `admin123`
- **Technician**: `joao.silva@neuramaint.com` / `tech123`
- **Manager**: `maria.santos@neuramaint.com` / `manager123`

### Equipment
- **3 Industrial Pumps** with different specifications
- **8 Sensors** across all pumps (temperature, vibration, pressure, rotation, flow)
- **24 hours** of realistic sensor data (5-minute intervals)
- **3 Sample Alerts** (resolved and pending)
- **2 Maintenance Records** (preventive and corrective)

## 🔍 Schema Details

### Enums

```prisma
enum TipoPapel {
  admin    // System administrator
  tecnico  // Maintenance technician  
  gestor   // Operations manager
}

enum StatusBomba {
  ativo    // Active/operational
  inativo  // Inactive/offline
}

enum TipoSensor {
  temperatura  // Temperature sensor (°C)
  vibracao    // Vibration sensor (mm/s)
  pressao     // Pressure sensor (bar)
  fluxo       // Flow sensor (m³/h)
  rotacao     // Rotation sensor (rpm)
}

enum StatusAlerta {
  pendente   // Pending action
  resolvido  // Resolved
  cancelado  // Cancelled
}

enum NivelAlerta {
  normal   // Green status
  atencao  // Amber status  
  critico  // Red status
}
```

### Key Indexes

- `leituras.timestamp` - For time-series queries
- `leituras.sensorId, timestamp` - For sensor-specific time-series
- `alertas.status` - For active alerts filtering
- `alertas.nivel` - For RAG status queries
- `alertas.bombaId, status` - For pump-specific alerts

## 🔧 Database Configuration

### Connection Pool Settings

The Prisma client is configured with:
- **Logging**: Query, error, info, and warn events
- **Error Format**: Pretty (development)
- **Connection Pooling**: Automatic via Prisma

### Performance Optimizations

1. **Indexed Queries**: Critical paths are indexed for fast lookups
2. **Time-Series Data**: Optimized for sensor reading queries
3. **Cascade Deletes**: Proper cleanup of related data
4. **JSON Fields**: For flexible metadata storage

## 📊 Data Model Usage Examples

### Query Recent Sensor Readings
```typescript
const recentReadings = await prisma.leitura.findMany({
  where: {
    sensor: {
      bombaId: 1
    },
    timestamp: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    }
  },
  include: {
    sensor: true
  },
  orderBy: {
    timestamp: 'desc'
  }
});
```

### Get Active Alerts by Level
```typescript
const criticalAlerts = await prisma.alerta.findMany({
  where: {
    status: 'pendente',
    nivel: 'critico'
  },
  include: {
    bomba: true
  }
});
```

### Calculate Pump Health Status
```typescript
const pumpHealth = await prisma.bomba.findUnique({
  where: { id: 1 },
  include: {
    sensores: {
      include: {
        leituras: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    },
    alertas: {
      where: {
        status: 'pendente'
      }
    }
  }
});
```

## 🚀 Production Considerations

### Migration Strategy
1. Use `prisma migrate deploy` for production deployments
2. Test migrations in staging environment first
3. Backup database before applying migrations

### Security
- Use connection pooling for high-traffic scenarios
- Implement proper database user permissions
- Enable SSL for production connections
- Regular security updates for dependencies

### Monitoring
- Monitor query performance with Prisma logging
- Set up database connection monitoring
- Implement proper error handling and logging

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [ElephantSQL Setup Guide](https://www.elephantsql.com/docs/)
- [Prisma Studio Guide](https://www.prisma.io/docs/concepts/components/prisma-studio)

## 🆘 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall/network settings

2. **Migration Errors**
   - Reset database: `npm run db:reset`
   - Check for conflicting schema changes
   - Verify PostgreSQL version compatibility

3. **Seed Script Fails**
   - Ensure database is empty or reset
   - Check for unique constraint violations
   - Verify all dependencies are installed

### Getting Help

- Check backend logs for detailed error messages
- Use Prisma Studio to inspect database state
- Verify environment variables are correctly set
- Test database connection with health endpoint: `GET /health`