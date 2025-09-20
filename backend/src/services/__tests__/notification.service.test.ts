import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import { NotificationService } from '../notification.service.js';
import { resetAllMocks } from '../../__tests__/setup.js';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('sendAlertNotification', () => {
    const mockAlert = {
      id: 1,
      tipo: 'temperatura_alta',
      mensagem: 'Temperature exceeded threshold',
      nivel: 'critico',
      status: 'pendente',
      bomba: {
        id: 1,
        nome: 'Test Pump',
        localizacao: 'Test Location'
      }
    };

    it('should send alert notification successfully', () => {
      // Act
      const result = NotificationService.sendAlertNotification(mockAlert);

      // Assert
      expect(result).toBe(true);
      // Since this is a mock implementation, we just verify it doesn't throw
    });

    it('should handle notification for different alert levels', () => {
      // Arrange
      const warningAlert = { ...mockAlert, nivel: 'atencao' };
      const normalAlert = { ...mockAlert, nivel: 'normal' };

      // Act
      const result1 = NotificationService.sendAlertNotification(warningAlert);
      const result2 = NotificationService.sendAlertNotification(normalAlert);

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should handle notification with minimal alert data', () => {
      // Arrange
      const minimalAlert = {
        id: 2,
        tipo: 'vibracao_alta',
        mensagem: 'High vibration detected',
        nivel: 'medio',
        status: 'pendente'
      };

      // Act
      const result = NotificationService.sendAlertNotification(minimalAlert as any);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('broadcastSystemEvent', () => {
    it('should broadcast system event to all listeners', () => {
      // Arrange
      const mockCallback = jest.fn();
      NotificationService.subscribeToSystemEvents(mockCallback);

      // Act
      NotificationService.broadcastSystemEvent('test_event', { data: 'test' });

      // Assert
      expect(mockCallback).toHaveBeenCalledWith('test_event', { data: 'test' });
    });

    it('should handle multiple subscribers', () => {
      // Arrange
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      NotificationService.subscribeToSystemEvents(mockCallback1);
      NotificationService.subscribeToSystemEvents(mockCallback2);

      // Act
      NotificationService.broadcastSystemEvent('test_event', { data: 'test' });

      // Assert
      expect(mockCallback1).toHaveBeenCalledWith('test_event', { data: 'test' });
      expect(mockCallback2).toHaveBeenCalledWith('test_event', { data: 'test' });
    });

    it('should remove subscribers correctly', () => {
      // Arrange
      const mockCallback = jest.fn();
      NotificationService.subscribeToSystemEvents(mockCallback);
      NotificationService.unsubscribeFromSystemEvents(mockCallback);

      // Act
      NotificationService.broadcastSystemEvent('test_event', { data: 'test' });

      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('subscribeToSystemEvents', () => {
    it('should add callback to subscribers list', () => {
      // Arrange
      const mockCallback = jest.fn();

      // Act
      NotificationService.subscribeToSystemEvents(mockCallback);

      // Assert
      // We can't directly test the internal subscribers array, but we can test
      // that broadcasting calls the callback
      NotificationService.broadcastSystemEvent('test', {});
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should prevent duplicate subscriptions', () => {
      // Arrange
      const mockCallback = jest.fn();

      // Act
      NotificationService.subscribeToSystemEvents(mockCallback);
      NotificationService.subscribeToSystemEvents(mockCallback);

      // Broadcast event
      NotificationService.broadcastSystemEvent('test', { count: 1 });

      // Assert
      // Callback should only be called once even though subscribed twice
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });
});