import { ReadingModel, CreateReadingData, ReadingWithSensor, ReadingFilters } from '../models/reading.model.js';
import { ValidationUtils } from '../utils/validation.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

export interface CreateReadingRequest {
  valor: number;
  timestamp?: string | Date;
  qualidade?: number;
}

export interface BatchCreateReadingRequest {
  readings: Array<{
    sensorId: number;
    valor: number;
    timestamp?: string | Date;
    qualidade?: number;
  }>;
}

export class ReadingService {
  /**
   * Create a new sensor reading
   */
  static async createReading(
    sensorId: number,
    readingData: CreateReadingRequest,
    requestingUserRole: TipoPapel
  ): Promise<any> {
    // Check permissions - all authenticated users can create readings (for simulator)
    if (!this.hasCreatePermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to create readings');
    }

    // Validate sensor exists
    const sensorExists = await ReadingModel.sensorExists(sensorId);
    if (!sensorExists) {
      throw new Error('Sensor not found');
    }

    // Validate reading data
    this.validateReadingData(readingData);

    // Prepare reading data
    const createData: CreateReadingData = {
      sensorId,
      valor: readingData.valor,
      timestamp: readingData.timestamp ? new Date(readingData.timestamp) : new Date(),
      qualidade: readingData.qualidade ?? 100,
    };

    // Create reading
    return await ReadingModel.createReading(createData);
  }

  /**
   * Create multiple readings in batch
   */
  static async createBatchReadings(
    batchData: BatchCreateReadingRequest,
    requestingUserRole: TipoPapel
  ): Promise<{ count: number }> {
    // Check permissions
    if (!this.hasCreatePermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to create readings');
    }

    // Validate batch data
    if (!batchData.readings || !Array.isArray(batchData.readings) || batchData.readings.length === 0) {
      throw new Error('Readings array is required and must not be empty');
    }

    if (batchData.readings.length > 1000) {
      throw new Error('Maximum 1000 readings per batch');
    }

    // Validate each reading
    for (let index = 0; index < batchData.readings.length; index++) {
      const reading = batchData.readings[index];
      try {
        this.validateReadingData(reading);
        
        // Check if sensor exists
        const sensorExists = await ReadingModel.sensorExists(reading.sensorId);
        if (!sensorExists) {
          throw new Error(`Sensor ${reading.sensorId} not found`);
        }
      } catch (error) {
        throw new Error(`Validation failed for reading ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Prepare batch data
    const createData: CreateReadingData[] = batchData.readings.map(reading => ({
      sensorId: reading.sensorId,
      valor: reading.valor,
      timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date(),
      qualidade: reading.qualidade ?? 100,
    }));

    // Create batch readings
    return await ReadingModel.createBatchReadings(createData);
  }

  /**
   * Get reading by ID
   */
  static async getReadingById(
    readingId: number,
    requestingUserRole: TipoPapel
  ): Promise<ReadingWithSensor | null> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view readings');
    }

    return await ReadingModel.findReadingById(readingId);
  }

  /**
   * Get readings with pagination and filters
   */
  static async getReadings(
    page: number = 1,
    limit: number = 100,
    filters: ReadingFilters = {},
    requestingUserRole: TipoPapel
  ): Promise<{
    readings: ReadingWithSensor[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view readings');
    }

    // Validate pagination
    const { page: validPage, limit: validLimit, errors } = ValidationUtils.validatePagination(page, limit);
    if (ValidationUtils.hasErrors(errors)) {
      const formattedErrors = ValidationUtils.formatErrors(errors);
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    // Validate date filters
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      throw new Error('Start date must be before end date');
    }

    return await ReadingModel.findReadings(validPage, validLimit, filters);
  }

  /**
   * Get readings for specific sensor
   */
  static async getReadingsBySensor(
    sensorId: number,
    page: number = 1,
    limit: number = 100,
    startDate?: Date,
    endDate?: Date,
    requestingUserRole?: TipoPapel
  ): Promise<{
    readings: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Check permissions if role is provided
    if (requestingUserRole && !this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view readings');
    }

    // Validate sensor exists
    const sensorExists = await ReadingModel.sensorExists(sensorId);
    if (!sensorExists) {
      throw new Error('Sensor not found');
    }

    // Validate pagination
    const { page: validPage, limit: validLimit, errors } = ValidationUtils.validatePagination(page, limit);
    if (ValidationUtils.hasErrors(errors)) {
      const formattedErrors = ValidationUtils.formatErrors(errors);
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    return await ReadingModel.getReadingsBySensor(sensorId, validPage, validLimit, startDate, endDate);
  }

  /**
   * Get latest reading for sensor
   */
  static async getLatestReading(
    sensorId: number,
    requestingUserRole?: TipoPapel
  ): Promise<any> {
    // Check permissions if role is provided
    if (requestingUserRole && !this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view readings');
    }

    // Validate sensor exists
    const sensorExists = await ReadingModel.sensorExists(sensorId);
    if (!sensorExists) {
      throw new Error('Sensor not found');
    }

    return await ReadingModel.getLatestReading(sensorId);
  }

  /**
   * Get reading statistics for sensor
   */
  static async getReadingStats(
    sensorId: number,
    startDate?: Date,
    endDate?: Date,
    requestingUserRole?: TipoPapel
  ): Promise<{
    count: number;
    avg: number;
    min: number;
    max: number;
    avgQuality: number;
  }> {
    // Check permissions if role is provided
    if (requestingUserRole && !this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view reading statistics');
    }

    // Validate sensor exists
    const sensorExists = await ReadingModel.sensorExists(sensorId);
    if (!sensorExists) {
      throw new Error('Sensor not found');
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    return await ReadingModel.getReadingStats(sensorId, startDate, endDate);
  }

  /**
   * Get aggregated readings
   */
  static async getAggregatedReadings(
    sensorId: number,
    interval: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
    requestingUserRole: TipoPapel
  ): Promise<Array<{
    period: string;
    avg: number;
    min: number;
    max: number;
    count: number;
  }>> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view aggregated readings');
    }

    // Validate sensor exists
    const sensorExists = await ReadingModel.sensorExists(sensorId);
    if (!sensorExists) {
      throw new Error('Sensor not found');
    }

    // Validate date range
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    // Validate date range is not too large
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const maxDays = {
      hour: 7,      // 7 days for hourly data
      day: 365,     // 1 year for daily data
      week: 730,    // 2 years for weekly data
      month: 3650   // 10 years for monthly data
    };

    if (daysDiff > maxDays[interval]) {
      throw new Error(`Date range too large for ${interval} interval. Maximum ${maxDays[interval]} days allowed.`);
    }

    return await ReadingModel.getAggregatedReadings(sensorId, interval, startDate, endDate);
  }

  /**
   * Clean old readings (data retention)
   */
  static async cleanOldReadings(
    olderThanDays: number,
    requestingUserRole: TipoPapel
  ): Promise<{ count: number }> {
    // Only admins can clean old readings
    if (requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to clean old readings');
    }

    if (olderThanDays < 30) {
      throw new Error('Cannot delete readings newer than 30 days');
    }

    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - olderThanDays);

    return await ReadingModel.deleteOldReadings(olderThan);
  }

  /**
   * Validate reading data
   */
  private static validateReadingData(readingData: any): void {
    // Validate value
    if (readingData.valor === undefined || readingData.valor === null) {
      throw new Error('Reading value is required');
    }

    if (typeof readingData.valor !== 'number' || isNaN(readingData.valor)) {
      throw new Error('Reading value must be a valid number');
    }

    if (!isFinite(readingData.valor)) {
      throw new Error('Reading value must be finite');
    }

    // Validate timestamp if provided
    if (readingData.timestamp !== undefined) {
      const timestamp = new Date(readingData.timestamp);
      if (isNaN(timestamp.getTime())) {
        throw new Error('Invalid timestamp format');
      }

      // Don't allow future timestamps more than 1 hour ahead
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      if (timestamp > oneHourFromNow) {
        throw new Error('Timestamp cannot be more than 1 hour in the future');
      }

      // Don't allow timestamps older than 1 year
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      if (timestamp < oneYearAgo) {
        throw new Error('Timestamp cannot be older than 1 year');
      }
    }

    // Validate quality if provided
    if (readingData.qualidade !== undefined) {
      if (typeof readingData.qualidade !== 'number' || isNaN(readingData.qualidade)) {
        throw new Error('Quality must be a valid number');
      }

      if (readingData.qualidade < 0 || readingData.qualidade > 100) {
        throw new Error('Quality must be between 0 and 100');
      }
    }
  }

  /**
   * Check if user has view permissions
   */
  private static hasViewPermission(userRole: TipoPapel): boolean {
    return ['admin', 'gestor', 'tecnico'].includes(userRole);
  }

  /**
   * Check if user has create permissions
   */
  private static hasCreatePermission(userRole: TipoPapel): boolean {
    // Allow all authenticated users to create readings (for simulator and data ingestion)
    return ['admin', 'gestor', 'tecnico'].includes(userRole);
  }
}