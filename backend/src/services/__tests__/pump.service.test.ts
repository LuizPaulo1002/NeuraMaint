import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { PumpService } from '../pump.service.ts';
import { PumpModel } from '../../models/pump.model.ts';
import { ValidationUtils } from '../../utils/validation.ts';
import { resetAllMocks } from '../../__tests__/setup.ts';

// Mock dependencies
jest.mock('../../models/pump.model.ts');
jest.mock('../../utils/validation.ts');

const mockPumpModel = PumpModel as jest.Mocked<typeof PumpModel>;
const mockValidationUtils = ValidationUtils as jest.Mocked<typeof ValidationUtils>;

describe('PumpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPump', () => {
    const validPumpData = {
      nome: 'Pump 001',
      modelo: 'Model X',
      localizacao: 'Factory A',
      status: 'ativo',
      capacidade: 1000,
      potencia: 50,
      anoFabricacao: 2020,
      dataInstalacao: '2021-01-15',
      proximaManutencao: '2024-12-31',
      observacoes: 'Test pump',
      usuarioId: 1
    };

    const mockCreatedPump = {
      id: 1,
      nome: 'Pump 001',
      modelo: 'Model X',
      localizacao: 'Factory A',
      status: 'ativo',
      capacidade: 1000,
      potencia: 50,
      anoFabricacao: 2020,
      dataInstalacao: new Date('2021-01-15'),
      proximaManutencao: new Date('2024-12-31'),
      observacoes: 'Test pump',
      usuarioId: 1,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };

    const mockPumpWithRAG = {
      ...mockCreatedPump,
      failureProbability: 25.5,
      ragStatus: 'green'
    };

    it('should successfully create pump when user is admin', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockPumpModel.createPump.mockResolvedValue(mockCreatedPump);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      const result = await PumpService.createPump(validPumpData, 1, 'admin');

      // Assert
      expect(result).toEqual(mockPumpWithRAG);
      expect(mockPumpModel.pumpNameExists).toHaveBeenCalledWith(validPumpData.nome);
      expect(mockPumpModel.createPump).toHaveBeenCalledWith({
        nome: validPumpData.nome,
        modelo: validPumpData.modelo,
        localizacao: validPumpData.localizacao,
        status: validPumpData.status,
        capacidade: validPumpData.capacidade,
        potencia: validPumpData.potencia,
        anoFabricacao: validPumpData.anoFabricacao,
        dataInstalacao: new Date(validPumpData.dataInstalacao),
        proximaManutencao: new Date(validPumpData.proximaManutencao),
        observacoes: validPumpData.observacoes,
        usuarioId: validPumpData.usuarioId
      });
    });

    it('should deny non-admin users from creating pumps', async () => {
      // Act & Assert
      await expect(PumpService.createPump(validPumpData, 1, 'tecnico'))
        .rejects.toThrow('Insufficient permissions to create pumps');
      expect(mockPumpModel.createPump).not.toHaveBeenCalled();
    });

    it('should deny gestor users from creating pumps', async () => {
      // Act & Assert
      await expect(PumpService.createPump(validPumpData, 1, 'gestor'))
        .rejects.toThrow('Insufficient permissions to create pumps');
      expect(mockPumpModel.createPump).not.toHaveBeenCalled();
    });

    it('should throw error if pump name already exists', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(true);

      // Act & Assert
      await expect(PumpService.createPump(validPumpData, 1, 'admin'))
        .rejects.toThrow('Pump name already exists');
      expect(mockPumpModel.createPump).not.toHaveBeenCalled();
    });

    it('should use default status "ativo" when not provided', async () => {
      // Arrange
      const pumpDataWithoutStatus = { ...validPumpData };
      delete pumpDataWithoutStatus.status;

      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockPumpModel.createPump.mockResolvedValue(mockCreatedPump);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      await PumpService.createPump(pumpDataWithoutStatus, 1, 'admin');

      // Assert
      expect(mockPumpModel.createPump).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ativo' })
      );
    });

    it('should use requesting user ID when usuarioId not provided', async () => {
      // Arrange
      const pumpDataWithoutUserId = { ...validPumpData };
      delete pumpDataWithoutUserId.usuarioId;

      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockPumpModel.createPump.mockResolvedValue(mockCreatedPump);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      await PumpService.createPump(pumpDataWithoutUserId, 2, 'admin');

      // Assert
      expect(mockPumpModel.createPump).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 2 })
      );
    });

    it('should sanitize input data', async () => {
      // Arrange
      const pumpDataWithXSS = {
        ...validPumpData,
        nome: '<script>alert("xss")</script>Pump',
        observacoes: '<img src=x onerror=alert(1)>Test'
      };

      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input.replace(/<[^>]*>/g, ''));
      mockPumpModel.createPump.mockResolvedValue(mockCreatedPump);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      await PumpService.createPump(pumpDataWithXSS, 1, 'admin');

      // Assert
      expect(mockValidationUtils.sanitizeInput).toHaveBeenCalledWith(pumpDataWithXSS.nome);
      expect(mockValidationUtils.sanitizeInput).toHaveBeenCalledWith(pumpDataWithXSS.observacoes);
    });

    it('should handle optional fields correctly', async () => {
      // Arrange
      const minimalPumpData = {
        nome: 'Minimal Pump',
        localizacao: 'Test Location'
      };

      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockPumpModel.createPump.mockResolvedValue(mockCreatedPump);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      await PumpService.createPump(minimalPumpData, 1, 'admin');

      // Assert
      expect(mockPumpModel.createPump).toHaveBeenCalledWith({
        nome: 'Minimal Pump',
        localizacao: 'Test Location',
        status: 'ativo',
        usuarioId: 1
      });
    });
  });

  describe('getPumpById', () => {
    const mockPumpWithRAG = {
      id: 1,
      nome: 'Pump 001',
      localizacao: 'Factory A',
      usuarioId: 1,
      failureProbability: 25.5,
      ragStatus: 'green'
    };

    it('should allow admin to view any pump', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      const result = await PumpService.getPumpById(1, 'admin', 2);

      // Assert
      expect(result).toEqual(mockPumpWithRAG);
      expect(mockPumpModel.findPumpByIdWithRAG).toHaveBeenCalledWith(1);
    });

    it('should allow gestor to view any pump', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      const result = await PumpService.getPumpById(1, 'gestor', 2);

      // Assert
      expect(result).toEqual(mockPumpWithRAG);
    });

    it('should allow tecnico to view their assigned pump', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      const result = await PumpService.getPumpById(1, 'tecnico', 1);

      // Assert
      expect(result).toEqual(mockPumpWithRAG);
    });

    it('should hide pump from tecnico if not assigned to them', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockPumpWithRAG);

      // Act
      const result = await PumpService.getPumpById(1, 'tecnico', 2);

      // Assert
      expect(result).toBeNull();
    });

    it('should deny access for users without view permissions', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(false);

      // Act & Assert
      await expect(PumpService.getPumpById(1, 'invalid_role' as any))
        .rejects.toThrow('Insufficient permissions to view pumps');
      expect(mockPumpModel.findPumpByIdWithRAG).not.toHaveBeenCalled();
    });
  });

  describe('getAllPumps', () => {
    const mockPumpsResult = {
      pumps: [
        {
          id: 1,
          nome: 'Pump 001',
          usuarioId: 1,
          failureProbability: 25.5,
          ragStatus: 'green'
        }
      ],
      total: 1,
      page: 1,
      totalPages: 1
    };

    it('should allow admin to view all pumps', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        errors: []
      });
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockPumpModel.findAllPumps.mockResolvedValue(mockPumpsResult);

      // Act
      const result = await PumpService.getAllPumps(1, 10, {}, 'admin', 1);

      // Assert
      expect(result).toEqual(mockPumpsResult);
      expect(mockPumpModel.findAllPumps).toHaveBeenCalledWith(1, 10, {});
    });

    it('should filter pumps for tecnico to show only assigned ones', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        errors: []
      });
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockPumpModel.findAllPumps.mockResolvedValue(mockPumpsResult);

      // Act
      const result = await PumpService.getAllPumps(1, 10, { search: 'pump' }, 'tecnico', 2);

      // Assert
      expect(result).toEqual(mockPumpsResult);
      expect(mockPumpModel.findAllPumps).toHaveBeenCalledWith(1, 10, {
        search: 'pump',
        usuarioId: 2
      });
    });

    it('should validate pagination parameters', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      const paginationErrors = [{ field: 'page', message: 'Invalid page number', code: 'INVALID' }];
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        errors: paginationErrors
      });
      mockValidationUtils.hasErrors.mockReturnValue(true);
      mockValidationUtils.formatErrors.mockReturnValue({
        errors: { page: ['Invalid page number'] }
      });

      // Act & Assert
      await expect(PumpService.getAllPumps(-1, 10, {}, 'admin'))
        .rejects.toThrow('Validation failed: {"page":["Invalid page number"]}');
      expect(mockPumpModel.findAllPumps).not.toHaveBeenCalled();
    });

    it('should sanitize search filters', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockValidationUtils.validatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        errors: []
      });
      mockValidationUtils.hasErrors.mockReturnValue(false);
      mockValidationUtils.sanitizeInput.mockReturnValue('clean search');
      mockPumpModel.findAllPumps.mockResolvedValue(mockPumpsResult);

      // Act
      await PumpService.getAllPumps(1, 10, { search: '<script>alert(1)</script>' }, 'admin');

      // Assert
      expect(mockValidationUtils.sanitizeInput).toHaveBeenCalledWith('<script>alert(1)</script>');
      expect(mockPumpModel.findAllPumps).toHaveBeenCalledWith(1, 10, { search: 'clean search' });
    });
  });

  describe('updatePump', () => {
    const updateData = {
      nome: 'Updated Pump',
      localizacao: 'New Location'
    };

    const mockUpdatedPump = {
      id: 1,
      nome: 'Updated Pump',
      localizacao: 'New Location',
      failureProbability: 30.0,
      ragStatus: 'amber'
    };

    it('should allow admin to update pump', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(false);
      mockValidationUtils.sanitizeInput.mockImplementation((input) => input);
      mockPumpModel.updatePump.mockResolvedValue({ id: 1 } as any);
      mockPumpModel.findPumpByIdWithRAG.mockResolvedValue(mockUpdatedPump);

      // Act
      const result = await PumpService.updatePump(1, updateData, 1, 'admin');

      // Assert
      expect(result).toEqual(mockUpdatedPump);
      expect(mockPumpModel.pumpNameExists).toHaveBeenCalledWith(updateData.nome, 1);
      expect(mockPumpModel.updatePump).toHaveBeenCalledWith(1, {
        nome: updateData.nome,
        localizacao: updateData.localizacao
      });
    });

    it('should deny non-admin users from updating pumps', async () => {
      // Act & Assert
      await expect(PumpService.updatePump(1, updateData, 1, 'tecnico'))
        .rejects.toThrow('Insufficient permissions to update pumps');
      expect(mockPumpModel.updatePump).not.toHaveBeenCalled();
    });

    it('should deny gestor from updating pumps', async () => {
      // Act & Assert
      await expect(PumpService.updatePump(1, updateData, 1, 'gestor'))
        .rejects.toThrow('Insufficient permissions to update pumps');
      expect(mockPumpModel.updatePump).not.toHaveBeenCalled();
    });

    it('should throw error if new name already exists', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'validatePumpData').mockImplementation(() => {});
      mockPumpModel.pumpNameExists.mockResolvedValue(true);

      // Act & Assert
      await expect(PumpService.updatePump(1, updateData, 1, 'admin'))
        .rejects.toThrow('Pump name already exists');
      expect(mockPumpModel.updatePump).not.toHaveBeenCalled();
    });
  });

  describe('deletePump', () => {
    const mockDeletedPump = {
      id: 1,
      nome: 'Deleted Pump',
      status: 'inativo'
    };

    it('should allow admin to delete pump', async () => {
      // Arrange
      mockPumpModel.deletePump.mockResolvedValue(mockDeletedPump);

      // Act
      const result = await PumpService.deletePump(1, 'admin');

      // Assert
      expect(result).toEqual(mockDeletedPump);
      expect(mockPumpModel.deletePump).toHaveBeenCalledWith(1);
    });

    it('should deny non-admin users from deleting pumps', async () => {
      // Act & Assert
      await expect(PumpService.deletePump(1, 'tecnico'))
        .rejects.toThrow('Insufficient permissions to delete pumps');
      expect(mockPumpModel.deletePump).not.toHaveBeenCalled();
    });
  });

  describe('validatePumpData', () => {
    it('should validate required fields', () => {
      // Arrange & Act & Assert
      expect(() => {
        (PumpService as any).validatePumpData({ localizacao: 'Test' });
      }).toThrow('Pump name is required');

      expect(() => {
        (PumpService as any).validatePumpData({ nome: 'Test Pump' });
      }).toThrow('Pump location is required');
    });

    it('should validate manufacturing year range', () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const invalidPumpData = {
        nome: 'Test Pump',
        localizacao: 'Test Location',
        anoFabricacao: 1800
      };

      // Act & Assert
      expect(() => {
        (PumpService as any).validatePumpData(invalidPumpData);
      }).toThrow(`Manufacturing year must be between 1900 and ${currentYear}`);
    });

    it('should validate future manufacturing year', () => {
      // Arrange
      const currentYear = new Date().getFullYear();
      const futurePumpData = {
        nome: 'Test Pump',
        localizacao: 'Test Location',
        anoFabricacao: currentYear + 1
      };

      // Act & Assert
      expect(() => {
        (PumpService as any).validatePumpData(futurePumpData);
      }).toThrow(`Manufacturing year must be between 1900 and ${currentYear}`);
    });

    it('should validate pump status values', () => {
      // Arrange
      const invalidStatusPumpData = {
        nome: 'Test Pump',
        localizacao: 'Test Location',
        status: 'invalid_status'
      };

      // Act & Assert
      expect(() => {
        (PumpService as any).validatePumpData(invalidStatusPumpData);
      }).toThrow('Invalid pump status. Must be "ativo" or "inativo"');
    });

    it('should validate installation date format', () => {
      // Arrange
      const invalidDatePumpData = {
        nome: 'Test Pump',
        localizacao: 'Test Location',
        dataInstalacao: 'invalid-date'
      };

      // Act & Assert
      expect(() => {
        (PumpService as any).validatePumpData(invalidDatePumpData);
      }).toThrow('Invalid installation date format');
    });

    it('should validate installation date is not in future', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDatePumpData = {
        nome: 'Test Pump',
        localizacao: 'Test Location',
        dataInstalacao: futureDate.toISOString()
      };

      // Act & Assert
      expect(() => {
        (PumpService as any).validatePumpData(futureDatePumpData);
      }).toThrow('Installation date cannot be in the future');
    });
  });

  describe('getPumpsByStatus', () => {
    const mockPumps = [
      { id: 1, nome: 'Active Pump', status: 'ativo', usuarioId: 1 },
      { id: 2, nome: 'Active Pump 2', status: 'ativo', usuarioId: 2 }
    ];

    it('should allow admin to get pumps by status', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.getPumpsByStatus.mockResolvedValue(mockPumps);

      // Act
      const result = await PumpService.getPumpsByStatus('ativo', 'admin');

      // Assert
      expect(result).toEqual(mockPumps);
      expect(mockPumpModel.getPumpsByStatus).toHaveBeenCalledWith('ativo');
    });

    it('should filter pumps for tecnico', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.getPumpsByStatus.mockResolvedValue(mockPumps);

      // Act
      const result = await PumpService.getPumpsByStatus('ativo', 'tecnico', 1);

      // Assert
      expect(result).toEqual([mockPumps[0]]);
      expect(mockPumpModel.getPumpsByStatus).toHaveBeenCalledWith('ativo');
    });
  });

  describe('getPumpsByUser', () => {
    const mockUserPumps = [
      { id: 1, nome: 'User Pump 1', usuarioId: 1 },
      { id: 2, nome: 'User Pump 2', usuarioId: 1 }
    ];

    it('should allow admin to get any user pumps', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.getPumpsByUser.mockResolvedValue(mockUserPumps);

      // Act
      const result = await PumpService.getPumpsByUser(1, 'admin', 2);

      // Assert
      expect(result).toEqual(mockUserPumps);
      expect(mockPumpModel.getPumpsByUser).toHaveBeenCalledWith(1);
    });

    it('should allow tecnico to get only their own pumps', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);
      mockPumpModel.getPumpsByUser.mockResolvedValue(mockUserPumps);

      // Act
      const result = await PumpService.getPumpsByUser(1, 'tecnico', 1);

      // Assert
      expect(result).toEqual(mockUserPumps);
    });

    it('should deny tecnico from getting other users pumps', async () => {
      // Arrange
      jest.spyOn(PumpService as any, 'hasViewPermission').mockReturnValue(true);

      // Act & Assert
      await expect(PumpService.getPumpsByUser(2, 'tecnico', 1))
        .rejects.toThrow('Insufficient permissions to view other users pumps');
      expect(mockPumpModel.getPumpsByUser).not.toHaveBeenCalled();
    });
  });
});