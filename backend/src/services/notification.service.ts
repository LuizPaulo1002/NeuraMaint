// Frontend Notification System Integration
// This module provides real-time alert notifications for the frontend

export interface AlertNotification {
  id: number;
  tipo: string;
  mensagem: string;
  nivel: 'normal' | 'atencao' | 'critico';
  status: 'pendente' | 'resolvido' | 'cancelado';
  valor: number | null;
  createdAt: Date;
  bomba: {
    id: number;
    nome: string;
    localizacao: string;
  };
}

/**
 * Notification Service
 * Handles alert notifications and system events
 */
export class NotificationService {
  private static subscribers: ((event: string, data: any) => void)[] = [];
  private static subscriberSet = new Set<((event: string, data: any) => void)>();

  /**
   * Send alert notification
   */
  static sendAlertNotification(alert: any): boolean {
    try {
      // In a real implementation, this would send the notification
      // For now, we just log it and return true
      console.log(`📢 [Notification] Alert: ${alert.nivel} level - ${alert.mensagem}`);
      return true;
    } catch (error) {
      console.error('Failed to send alert notification:', error);
      return false;
    }
  }

  /**
   * Broadcast system event to all subscribers
   */
  static broadcastSystemEvent(event: string, data: any): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(event, data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Subscribe to system events
   */
  static subscribeToSystemEvents(callback: (event: string, data: any) => void): void {
    // Prevent duplicate subscriptions
    if (!this.subscriberSet.has(callback)) {
      this.subscribers.push(callback);
      this.subscriberSet.add(callback);
    }
  }

  /**
   * Unsubscribe from system events
   */
  static unsubscribeFromSystemEvents(callback: (event: string, data: any) => void): void {
    const index = this.subscribers.indexOf(callback);
    if (index > -1) {
      this.subscribers.splice(index, 1);
      this.subscriberSet.delete(callback);
    }
  }
}

/**
 * Frontend Notification Manager
 * Handles real-time alert notifications for the frontend application
 */
export class FrontendNotificationManager {
  private static instance: FrontendNotificationManager;
  private listeners: ((notification: AlertNotification) => void)[] = [];
  private notificationQueue: AlertNotification[] = [];
  private isProcessing = false;

  private constructor() {
    // Initialize notification system
    this.setupNotificationHandler();
  }

  static getInstance(): FrontendNotificationManager {
    if (!FrontendNotificationManager.instance) {
      FrontendNotificationManager.instance = new FrontendNotificationManager();
    }
    return FrontendNotificationManager.instance;
  }

  /**
   * Setup notification handler integration with AlertService
   */
  private setupNotificationHandler(): void {
    // Import AlertService dynamically to avoid circular dependencies
    import('./alert.service.js').then((module) => {
      // If AlertService is exported as an instance with 'on', use it directly
      const alertServiceInstance = module.AlertService;
      if (alertServiceInstance && typeof alertServiceInstance.on === 'function') {
        alertServiceInstance.on('alertCreated', (alert: any) => {
          this.handleNewAlert(alert);
        });
      } else {
        console.warn('AlertService does not expose an "on" method for alertCreated events.');
      }
    }).catch(error => {
      console.error('Failed to setup notification handler:', error);
    });
  }

  /**
   * Handle new alert notification
   */
  private handleNewAlert(alert: any): void {
    const notification: AlertNotification = {
      id: alert.id,
      tipo: alert.tipo,
      mensagem: alert.mensagem,
      nivel: alert.nivel,
      status: alert.status,
      valor: alert.valor,
      createdAt: alert.createdAt,
      bomba: alert.bomba
    };

    // Add to queue and process
    this.notificationQueue.push(notification);
    this.processNotificationQueue();

    console.log(`📢 [Notification] New alert: ${notification.nivel} level for ${notification.bomba.nome}`);
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        if (notification) {
          // Notify all registered listeners
          this.listeners.forEach(listener => {
            try {
              listener(notification);
            } catch (error) {
              console.error('Error in notification listener:', error);
            }
          });

          // Add delay between notifications to prevent spam
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Subscribe to alert notifications
   */
  onAlertNotification(callback: (notification: AlertNotification) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Unsubscribe from alert notifications
   */
  removeNotificationListener(callback: (notification: AlertNotification) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get pending notifications count
   */
  getPendingNotificationsCount(): number {
    return this.notificationQueue.length;
  }

  /**
   * Clear all pending notifications
   */
  clearNotifications(): void {
    this.notificationQueue.length = 0;
  }

  /**
   * Format notification for frontend display
   */
  formatNotificationForDisplay(notification: AlertNotification): {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    icon: string;
    duration: number;
  } {
    const typeMap = {
      normal: { type: 'info' as const, icon: '🔵', duration: 5000 },
      atencao: { type: 'warning' as const, icon: '🟡', duration: 8000 },
      critico: { type: 'error' as const, icon: '🔴', duration: 0 } // Critical alerts don't auto-dismiss
    };

    const config = typeMap[notification.nivel];

    return {
      title: `Alert: ${notification.bomba.nome}`,
      message: notification.mensagem,
      type: config.type,
      icon: config.icon,
      duration: config.duration
    };
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): {
    totalListeners: number;
    pendingNotifications: number;
    isProcessing: boolean;
  } {
    return {
      totalListeners: this.listeners.length,
      pendingNotifications: this.notificationQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Export singleton instance
export const frontendNotificationManager = FrontendNotificationManager.getInstance();