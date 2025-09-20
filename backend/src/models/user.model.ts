import { Usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

export interface CreateUserData {
  nome: string;
  email: string;
  senha: string;
  papel: TipoPapel;
  ativo?: boolean;
}

export interface UpdateUserData {
  nome?: string;
  email?: string;
  senha?: string;
  papel?: TipoPapel;
  ativo?: boolean;
}

export interface UserWithoutPassword extends Omit<Usuario, 'senha'> {}

export class UserModel {
  /**
   * Create a new user with encrypted password
   */
  static async createUser(userData: CreateUserData): Promise<UserWithoutPassword> {
    const { senha, ...userDataWithoutPassword } = userData;
    
    // Hash password with bcrypt (cost 12)
    const hashedPassword = await bcrypt.hash(senha, 12);
    
    const user = await prisma.usuario.create({
      data: {
        ...userDataWithoutPassword,
        senha: hashedPassword,
      },
    });
    
    // Return user without password
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string): Promise<Usuario | null> {
    return await prisma.usuario.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  static async findUserById(id: number): Promise<UserWithoutPassword | null> {
    const user = await prisma.usuario.findUnique({
      where: { id },
    });
    
    if (!user) return null;
    
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users with pagination
   */
  static async findAllUsers(
    page: number = 1,
    limit: number = 10,
    filters?: {
      papel?: TipoPapel;
      ativo?: boolean;
      search?: string;
    }
  ): Promise<{
    users: UserWithoutPassword[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    
    const where: any = {};
    
    if (filters?.papel) {
      where.papel = filters.papel;
    }
    
    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }
    
    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.usuario.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPassword = users.map(({ senha: _, ...user }) => user);

    return {
      users: usersWithoutPassword,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update user data
   */
  static async updateUser(
    id: number,
    updateData: UpdateUserData
  ): Promise<UserWithoutPassword | null> {
    const { senha, ...dataWithoutPassword } = updateData;
    
    let updatePayload: any = dataWithoutPassword;
    
    // Hash new password if provided
    if (senha) {
      updatePayload.senha = await bcrypt.hash(senha, 12);
    }
    
    const user = await prisma.usuario.update({
      where: { id },
      data: updatePayload,
    });
    
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Delete user (soft delete by setting ativo = false)
   */
  static async deleteUser(id: number): Promise<UserWithoutPassword | null> {
    const user = await prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    });
    
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Hard delete user (permanent deletion)
   */
  static async hardDeleteUser(id: number): Promise<boolean> {
    try {
      await prisma.usuario.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate user password
   */
  static async validatePassword(user: Usuario, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.senha);
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const where: any = { email };
    
    if (excludeId) {
      where.id = { not: excludeId };
    }
    
    const user = await prisma.usuario.findFirst({ where });
    return !!user;
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(papel: TipoPapel): Promise<UserWithoutPassword[]> {
    const users = await prisma.usuario.findMany({
      where: { papel, ativo: true },
      orderBy: { nome: 'asc' },
    });
    
    return users.map(({ senha: _, ...user }) => user);
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: {
      admin: number;
      tecnico: number;
      gestor: number;
    };
  }> {
    const [total, active, inactive, adminCount, tecnicoCount, gestorCount] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { ativo: true } }),
      prisma.usuario.count({ where: { ativo: false } }),
      prisma.usuario.count({ where: { papel: 'admin', ativo: true } }),
      prisma.usuario.count({ where: { papel: 'tecnico', ativo: true } }),
      prisma.usuario.count({ where: { papel: 'gestor', ativo: true } }),
    ]);

    return {
      total,
      active,
      inactive,
      byRole: {
        admin: adminCount,
        tecnico: tecnicoCount,
        gestor: gestorCount,
      },
    };
  }

  /**
   * Change user password
   */
  static async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await prisma.usuario.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.senha);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash and update new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.usuario.update({
      where: { id },
      data: { senha: hashedNewPassword },
    });
    
    return true;
  }

  /**
   * Reset user password (admin function)
   */
  static async resetPassword(id: number, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.usuario.update({
      where: { id },
      data: { senha: hashedPassword },
    });
    
    return true;
  }
}