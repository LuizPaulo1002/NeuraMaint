import { render, screen } from '@testing-library/react';
import { RAGStatus, PumpRAGList } from './RAGStatus';
import { AlertsList } from './AlertsList';
import { Pump, Alert } from '@/services/dashboardService';

// Mock data for testing
const mockPumps: Pump[] = [
  { id: 1, nome: 'Pump 01', localizacao: 'Setor A', status: 'ativo', failureProbability: 15 },
  { id: 2, nome: 'Pump 02', localizacao: 'Setor B', status: 'ativo', failureProbability: 45 },
  { id: 3, nome: 'Pump 03', localizacao: 'Setor C', status: 'ativo', failureProbability: 85 },
];

const mockAlerts: Alert[] = [
  {
    id: 1,
    bomba_id: 3,
    tipo: 'temperatura_alta',
    nivel: 'alto',
    status: 'pendente',
    descricao: 'Temperature exceeded critical threshold',
    timestamp: new Date().toISOString(),
    bomba: { nome: 'Pump 03', localizacao: 'Setor C' }
  }
];

describe('Dashboard Components', () => {
  test('RAGStatus shows correct status for different probabilities', () => {
    const { rerender } = render(<RAGStatus probability={15} />);
    expect(screen.getByText('Normal')).toBeInTheDocument();

    rerender(<RAGStatus probability={45} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<RAGStatus probability={85} />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  test('PumpRAGList groups pumps correctly', () => {
    render(<PumpRAGList pumps={mockPumps} />);
    
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    
    expect(screen.getByText('Pump 01')).toBeInTheDocument();
    expect(screen.getByText('Pump 02')).toBeInTheDocument();
    expect(screen.getByText('Pump 03')).toBeInTheDocument();
  });

  test('AlertsList displays alerts correctly', async () => {
    const mockResolveAlert = jest.fn();
    
    render(
      <AlertsList 
        alerts={mockAlerts} 
        onResolveAlert={mockResolveAlert} 
      />
    );
    
    expect(screen.getByText('Pump 03')).toBeInTheDocument();
    expect(screen.getByText('Temperature exceeded critical threshold')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Resolve')).toBeInTheDocument();
  });

  test('AlertsList shows empty state when no alerts', () => {
    const mockResolveAlert = jest.fn();
    
    render(
      <AlertsList 
        alerts={[]} 
        onResolveAlert={mockResolveAlert} 
      />
    );
    
    expect(screen.getByText('No pending alerts')).toBeInTheDocument();
    expect(screen.getByText('All systems are operating normally.')).toBeInTheDocument();
  });
});