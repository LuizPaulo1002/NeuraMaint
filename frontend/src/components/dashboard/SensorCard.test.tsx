import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SensorCard } from './SensorCard';

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
}));

jest.mock('./TimeSeriesChart', () => ({
  TimeSeriesChart: ({ title }: { title: string }) => <div>{title}</div>
}));

describe('SensorCard Component', () => {
  const mockSensorData = [
    { timestamp: '2024-01-15T10:00:00Z', value: 45.5 },
    { timestamp: '2024-01-15T10:01:00Z', value: 46.2 },
    { timestamp: '2024-01-15T10:02:00Z', value: 44.8 }
  ];

  test('renders temperature sensor card correctly', () => {
    render(
      <SensorCard
        sensorType="temperatura"
        data={mockSensorData}
        currentValue={45.5}
        status="normal"
      />
    );

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('45.5')).toBeInTheDocument();
    expect(screen.getByText('°C')).toBeInTheDocument();
    expect(screen.getByText('normal')).toBeInTheDocument();
  });

  test('renders vibration sensor card correctly', () => {
    render(
      <SensorCard
        sensorType="vibracao"
        data={mockSensorData}
        currentValue={2.5}
        status="warning"
      />
    );

    expect(screen.getByText('Vibration')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('mm/s')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  test('renders pressure sensor card correctly', () => {
    render(
      <SensorCard
        sensorType="pressao"
        data={mockSensorData}
        currentValue={5.0}
        status="critical"
      />
    );

    expect(screen.getByText('Pressure')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  test('calculates statistics correctly', () => {
    render(
      <SensorCard
        sensorType="temperatura"
        data={mockSensorData}
        currentValue={45.5}
      />
    );

    // Check that min, avg, max are displayed
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Avg')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();

    // Values should be calculated from mockSensorData
    expect(screen.getByText('44.8 °C')).toBeInTheDocument(); // Min
    expect(screen.getByText('46.2 °C')).toBeInTheDocument(); // Max
  });

  test('shows chart when showChart is true', () => {
    render(
      <SensorCard
        sensorType="temperatura"
        data={mockSensorData}
        showChart={true}
      />
    );

    expect(screen.getByText('Temperature - Last 30 Minutes')).toBeInTheDocument();
  });

  test('hides chart when showChart is false', () => {
    render(
      <SensorCard
        sensorType="temperatura"
        data={mockSensorData}
        showChart={false}
      />
    );

    expect(screen.queryByText('Temperature - Last 30 Minutes')).not.toBeInTheDocument();
  });

  test('shows no data message when data array is empty', () => {
    render(
      <SensorCard
        sensorType="temperatura"
        data={[]}
        showChart={true}
      />
    );

    expect(screen.getByText('No sensor data available')).toBeInTheDocument();
  });

  test('applies correct status styling', () => {
    const { container } = render(
      <SensorCard
        sensorType="temperatura"
        data={mockSensorData}
        status="critical"
      />
    );

    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('border-red-200');
    expect(cardElement).toHaveClass('bg-red-50');
  });

  test('uses custom unit when provided', () => {
    render(
      <SensorCard
        sensorType="temperatura"
        data={mockSensorData}
        currentValue={100}
        unit="°F"
      />
    );

    expect(screen.getByText('°F')).toBeInTheDocument();
  });
});