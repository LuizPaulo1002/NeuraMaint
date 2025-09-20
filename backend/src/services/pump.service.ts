import { PumpModel, CreatePumpData, UpdatePumpData, PumpWithRAGStatus, PumpFilters } from '../models/pump.model.js';
import { ValidationUtils } from '../utils/validation.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';
type StatusBomba = 'ativo' | 'inativo';

export interface CreatePumpRequest {
  nome: string;
  modelo?: string;
  localizacao: string;
  status?: StatusBomba;
  capacidade?: number;
  potencia?: number;
  anoFabricacao?: number;
  dataInstalacao?: string;
  proximaManutencao?: string;
  observacoes?: string;
  usuarioId?: number;
}

export interface UpdatePumpRequest {
  nome?: string;
  modelo?: string;
  localizacao?: string;
  status?: StatusBomba;
  capacidade?: number;
  potencia?: number;
  anoFabricacao?: number;
  dataInstalacao?: string;
  proximaManutencao?: string;
  observacoes?: string;
  usuarioId?: number;
}

export class PumpService {
  /**
   * Create a new pump (admin only)
   */
  static async createPump(
    pumpData: CreatePumpRequest,
    requestingUserId: number,
    requestingUserRole: TipoPapel
  ): Promise<PumpWithRAGStatus> {
    // Check permissions - only admins can create pumps
    if (requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to create pumps');
    }

    // Validate pump data
    this.validatePumpData(pumpData);

    // Check if pump name already exists
    const nameExists = await PumpModel.pumpNameExists(pumpData.nome);
    if (nameExists) {
      throw new Error('Pump name already exists');
    }

    // Sanitize and prepare data
    const sanitizedData: CreatePumpData = {
      nome: ValidationUtils.sanitizeInput(pumpData.nome),
      localizacao: ValidationUtils.sanitizeInput(pumpData.localizacao),
      status: pumpData.status || 'ativo',
      usuarioId: pumpData.usuarioId || requestingUserId,
    };
    
    if (pumpData.modelo) {
      sanitizedData.modelo = ValidationUtils.sanitizeInput(pumpData.modelo);
    }
    if (pumpData.capacidade !== undefined) {
      sanitizedData.capacidade = pumpData.capacidade;
    }
    if (pumpData.potencia !== undefined) {
      sanitizedData.potencia = pumpData.potencia;
    }
    if (pumpData.anoFabricacao !== undefined) {
      sanitizedData.anoFabricacao = pumpData.anoFabricacao;
    }
    if (pumpData.dataInstalacao) {
      sanitizedData.dataInstalacao = new Date(pumpData.dataInstalacao);
    }
    if (pumpData.proximaManutencao) {
      sanitizedData.proximaManutencao = new Date(pumpData.proximaManutencao);
    }
    if (pumpData.observacoes) {
      sanitizedData.observacoes = ValidationUtils.sanitizeInput(pumpData.observacoes);
    }

    // Create pump
    const pump = await PumpModel.createPump(sanitizedData);
    
    // Return with RAG status
    const pumpWithRAG = await PumpModel.findPumpByIdWithRAG(pump.id);
    if (!pumpWithRAG) {
      throw new Error('Failed to retrieve created pump');
    }

    return pumpWithRAG;
  }

  /**
   * Get pump by ID
   */
  static async getPumpById(
    pumpId: number,
    requestingUserRole: TipoPapel,
    requestingUserId?: number
  ): Promise<PumpWithRAGStatus | null> {
    // Check permissions - all roles can view pumps
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view pumps');
    }

    const pump = await PumpModel.findPumpByIdWithRAG(pumpId);
    
    // Additional filtering for technicians (can only see their assigned pumps)
    if (requestingUserRole === 'tecnico' && requestingUserId) {
      if (pump && pump.usuarioId !== requestingUserId) {
        return null; // Hide pump if not assigned to this technician
      }
    }

    return pump;
  }

  /**
   * Get all pumps with pagination and filters
   */
  static async getAllPumps(
    page: number = 1,
    limit: number = 10,
    filters: PumpFilters = {},
    requestingUserRole: TipoPapel,
    requestingUserId?: number
  ): Promise<{
    pumps: PumpWithRAGStatus[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view pumps');
    }

    // Validate pagination
    const { page: validPage, limit: validLimit, errors } = ValidationUtils.validatePagination(page, limit);
    if (ValidationUtils.hasErrors(errors)) {
      const formattedErrors = ValidationUtils.formatErrors(errors);
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors.errors)}`);
    }

    // Apply role-based filtering
    let sanitizedFilters = { ...filters };
    
    // Technicians can only see their assigned pumps
    if (requestingUserRole === 'tecnico' && requestingUserId) {
      sanitizedFilters.usuarioId = requestingUserId;
    }

    // Sanitize search filter
    if (filters.search) {
      sanitizedFilters.search = ValidationUtils.sanitizeInput(filters.search);
    }

    return await PumpModel.findAllPumps(validPage, validLimit, sanitizedFilters);
  }

  /**
   * Update pump
   */
  static async updatePump(
    pumpId: number,
    updateData: UpdatePumpRequest,
    requestingUserId: number,
    requestingUserRole: TipoPapel
  ): Promise<PumpWithRAGStatus | null> {
    // Check permissions - only admins can update pumps
    if (requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to update pumps');
    }

    // Validate update data
    if (updateData.nome || updateData.localizacao) {
      this.validatePumpData(updateData as CreatePumpRequest);
    }

    // Check if new name already exists (exclude current pump)
    if (updateData.nome) {
      const nameExists = await PumpModel.pumpNameExists(updateData.nome, pumpId);
      if (nameExists) {
        throw new Error('Pump name already exists');
      }
    }

    // Sanitize input data
    const sanitizedData: UpdatePumpData = {};
    
    if (updateData.nome !== undefined) {
      sanitizedData.nome = ValidationUtils.sanitizeInput(updateData.nome);
    }
    if (updateData.modelo !== undefined) {
      if (updateData.modelo) {
        sanitizedData.modelo = ValidationUtils.sanitizeInput(updateData.modelo);
      } else {
        sanitizedData.modelo = updateData.modelo; // This handles null case
      }
    }
    if (updateData.localizacao !== undefined) {
      sanitizedData.localizacao = ValidationUtils.sanitizeInput(updateData.localizacao);
    }
    if (updateData.status !== undefined) {
      sanitizedData.status = updateData.status;
    }
    if (updateData.capacidade !== undefined) {
      sanitizedData.capacidade = updateData.capacidade;
    }
    if (updateData.potencia !== undefined) {
      sanitizedData.potencia = updateData.potencia;
    }
    if (updateData.anoFabricacao !== undefined) {
      sanitizedData.anoFabricacao = updateData.anoFabricacao;
    }
    if (updateData.dataInstalacao !== undefined) {
      if (updateData.dataInstalacao) {
        sanitizedData.dataInstalacao = new Date(updateData.dataInstalacao);
      }
    }
    if (updateData.proximaManutencao !== undefined) {
      if (updateData.proximaManutencao) {
        sanitizedData.proximaManutencao = new Date(updateData.proximaManutencao);
      }
    }
    if (updateData.observacoes !== undefined) {
      if (updateData.observacoes) {
        sanitizedData.observacoes = ValidationUtils.sanitizeInput(updateData.observacoes);
      } else {
        sanitizedData.observacoes = updateData.observacoes; // This handles null case
      }
    }
    if (updateData.usuarioId !== undefined) {
      sanitizedData.usuarioId = updateData.usuarioId;
    }

    // Update pump
    const updatedPump = await PumpModel.updatePump(pumpId, sanitizedData);
    if (!updatedPump) {
      return null;
    }

    // Return with RAG status
    return await PumpModel.findPumpByIdWithRAG(pumpId);
  }

  /**
   * Delete pump (soft delete)
   */
  static async deletePump(
    pumpId: number,
    requestingUserRole: TipoPapel
  ): Promise<any> {
    // Check permissions - only admins can delete pumps
    if (requestingUserRole !== 'admin') {
      throw new Error('Insufficient permissions to delete pumps');
    }

    const result = await PumpModel.deletePump(pumpId);
    return result;
  }

  /**
   * Get pumps by status
   */
  static async getPumpsByStatus(
    status: StatusBomba,
    requestingUserRole: TipoPapel,
    requestingUserId?: number
  ) {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view pumps');
    }

    const pumps = await PumpModel.getPumpsByStatus(status);
    
    // Filter for technicians
    if (requestingUserRole === 'tecnico' && requestingUserId) {
      return pumps.filter(pump => pump.usuarioId === requestingUserId);
    }

    return pumps;
  }

  /**
   * Get pumps by user
   */
  static async getPumpsByUser(
    usuarioId: number,
    requestingUserRole: TipoPapel,
    requestingUserId?: number
  ) {
    // Check permissions
    if (!this.hasViewPermission(requestingUserRole)) {
      throw new Error('Insufficient permissions to view pumps');
    }

    // Technicians can only see their own pumps
    if (requestingUserRole === 'tecnico' && requestingUserId !== usuarioId) {
      throw new Error('Insufficient permissions to view other users pumps');
    }

    return await PumpModel.getPumpsByUser(usuarioId);
  }

  /**
   * Get pump statistics
   */
  static async getPumpStats(requestingUserRole: TipoPapel) {
    // Check permissions - admins and managers can view stats
    if (!['admin', 'gestor'].includes(requestingUserRole)) {
      throw new Error('Insufficient permissions to view pump statistics');
    }

    return await PumpModel.getPumpStats();
  }

  /**
   * Validate pump data
   */
  private static validatePumpData(pumpData: Partial<CreatePumpRequest>): void {
    // Validate required fields
    if (pumpData.nome === undefined || !pumpData.nome || pumpData.nome.trim().length === 0) {
      throw new Error('Pump name is required');
    }
    if (pumpData.nome.length > 255) {
      throw new Error('Pump name must be less than 255 characters');
    }

    if (pumpData.localizacao === undefined || !pumpData.localizacao || pumpData.localizacao.trim().length === 0) {
      throw new Error('Pump location is required');
    }
    if (pumpData.localizacao.length > 500) {
      throw new Error('Pump location must be less than 500 characters');
    }

    // Validate optional numeric fields
    if (pumpData.capacidade !== undefined && pumpData.capacidade !== null) {
      if (pumpData.capacidade <= 0) {
        throw new Error('Pump capacity must be positive');
      }
    }

    if (pumpData.potencia !== undefined && pumpData.potencia !== null) {
      if (pumpData.potencia <= 0) {
        throw new Error('Pump power must be positive');
      }
    }

    if (pumpData.anoFabricacao !== undefined && pumpData.anoFabricacao !== null) {
      const currentYear = new Date().getFullYear();
      if (pumpData.anoFabricacao < 1900 || pumpData.anoFabricacao > currentYear) {
        throw new Error(`Manufacturing year must be between 1900 and ${currentYear}`);
      }
    }

    // Validate status
    if (pumpData.status !== undefined && !['ativo', 'inativo'].includes(pumpData.status)) {
      throw new Error('Invalid pump status. Must be "ativo" or "inativo"');
    }

    // Validate dates
    if (pumpData.dataInstalacao) {
      const installDate = new Date(pumpData.dataInstalacao);
      if (isNaN(installDate.getTime())) {
        throw new Error('Invalid installation date format');
      }
      if (installDate > new Date()) {
        throw new Error('Installation date cannot be in the future');
      }
    }

    if (pumpData.proximaManutencao) {
      const maintenanceDate = new Date(pumpData.proximaManutencao);
      if (isNaN(maintenanceDate.getTime())) {
        throw new Error('Invalid next maintenance date format');
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
   * Check if user has edit permissions
   */
  private static hasEditPermission(userRole: TipoPapel): boolean {
    return userRole === 'admin';
  }

  /**
   * Validate user permissions for specific actions
   */
  static validatePermissions(
    userRole: TipoPapel,
    action: 'create' | 'read' | 'update' | 'delete' | 'stats'
  ): boolean {
    switch (action) {
      case 'create':
      case 'update':
      case 'delete':
        return userRole === 'admin';
      
      case 'read':
        return ['admin', 'gestor', 'tecnico'].includes(userRole);
      
      case 'stats':
        return ['admin', 'gestor'].includes(userRole);
      
      default:
        return false;
    }
  }
}