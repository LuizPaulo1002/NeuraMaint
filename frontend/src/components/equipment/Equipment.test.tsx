import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EquipmentTable } from './EquipmentTable';
import { PumpForm } from './PumpForm';
import { DataTable } from '@/components/common/DataTable';
import { Pump } from '@/services/equipmentService';

// Mock data
const mockPumps: Pump[] = [
  {
    id: 1,
    nome: 'Pump 01',
    localizacao: 'Setor A',
    status: 'ativo',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    nome: 'Pump 02',
    localizacao: 'Setor B',
    status: 'manutencao',
    createdAt: '2024-01-15T10:35:00Z',
    updatedAt: '2024-01-15T10:35:00Z'
  }
];

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

describe('Equipment Management Components', () => {
  describe('DataTable', () => {
    const columns = [
      { key: 'nome', header: 'Name', sortable: true },
      { key: 'localizacao', header: 'Location', sortable: true },
      { key: 'status', header: 'Status' }
    ];

    test('renders table with data', () => {
      render(
        <DataTable 
          data={mockPumps} 
          columns={columns}
        />
      );

      expect(screen.getByText('Pump 01')).toBeInTheDocument();
      expect(screen.getByText('Pump 02')).toBeInTheDocument();
      expect(screen.getByText('Setor A')).toBeInTheDocument();
      expect(screen.getByText('Setor B')).toBeInTheDocument();
    });

    test('shows loading state', () => {
      render(
        <DataTable 
          data={[]} 
          columns={columns}
          loading={true}
        />
      );

      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    test('shows empty message when no data', () => {
      render(
        <DataTable 
          data={[]} 
          columns={columns}
          emptyMessage="No pumps available"
        />
      );

      expect(screen.getByText('No pumps available')).toBeInTheDocument();
    });

    test('supports sorting', async () => {
      const { container } = render(
        <DataTable 
          data={mockPumps} 
          columns={columns}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      fireEvent.click(nameHeader!);

      // Check for sort indicators
      expect(container.querySelector('.text-gray-900')).toBeInTheDocument();
    });
  });

  describe('EquipmentTable', () => {
    const mockHandlers = {
      onEdit: jest.fn(),
      onDelete: jest.fn(),
      onView: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('renders pump data correctly', () => {
      render(
        <EquipmentTable 
          pumps={mockPumps}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Pump 01')).toBeInTheDocument();
      expect(screen.getByText('ID: 1')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
    });

    test('handles edit action', () => {
      render(
        <EquipmentTable 
          pumps={mockPumps}
          {...mockHandlers}
        />
      );

      const editButtons = screen.getAllByTitle('Edit pump');
      fireEvent.click(editButtons[0]);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockPumps[0]);
    });

    test('handles view action', () => {
      render(
        <EquipmentTable 
          pumps={mockPumps}
          {...mockHandlers}
        />
      );

      const viewButtons = screen.getAllByTitle('View details');
      fireEvent.click(viewButtons[0]);

      expect(mockHandlers.onView).toHaveBeenCalledWith(mockPumps[0]);
    });

    test('shows confirmation dialog for delete', () => {
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <EquipmentTable 
          pumps={mockPumps}
          {...mockHandlers}
        />
      );

      const deleteButtons = screen.getAllByTitle('Delete pump');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockHandlers.onDelete).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('PumpForm', () => {
    test('renders create form', () => {
      render(<PumpForm />);

      expect(screen.getByText('Create New Pump')).toBeInTheDocument();
      expect(screen.getByLabelText(/Pump Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
      expect(screen.getByText('Create Pump')).toBeInTheDocument();
    });

    test('renders edit form with existing data', () => {
      render(
        <PumpForm 
          pump={mockPumps[0]} 
          isEditing={true}
        />
      );

      expect(screen.getByText('Edit Pump')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Pump 01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Setor A')).toBeInTheDocument();
      expect(screen.getByText('Update Pump')).toBeInTheDocument();
    });

    test('validates required fields', async () => {
      render(<PumpForm />);

      const nameInput = screen.getByLabelText(/Pump Name/);
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name is required/)).toBeInTheDocument();
      });
    });

    test('validates name length', async () => {
      render(<PumpForm />);

      const nameInput = screen.getByLabelText(/Pump Name/);
      fireEvent.change(nameInput, { target: { value: 'AB' } });
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/)).toBeInTheDocument();
      });
    });

    test('disables submit button when form is invalid', () => {
      render(<PumpForm />);

      const submitButton = screen.getByText('Create Pump');
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when form is valid', async () => {
      render(<PumpForm />);

      const nameInput = screen.getByLabelText(/Pump Name/);
      const locationSelect = screen.getByLabelText(/Location/);

      fireEvent.change(nameInput, { target: { value: 'Test Pump' } });
      fireEvent.change(locationSelect, { target: { value: 'Setor A' } });

      await waitFor(() => {
        const submitButton = screen.getByText('Create Pump');
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});