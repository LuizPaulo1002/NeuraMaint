// Type definitions
type TipoPapel = 'admin' | 'tecnico' | 'gestor';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export class ValidationUtils {
  /**
   * Validate email format and rules
   */
  static validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!email) {
      errors.push({
        field: 'email',
        message: 'Email is required',
        code: 'REQUIRED',
      });
      return errors;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_FORMAT',
      });
    }

    // Check email length
    if (email.length > 255) {
      errors.push({
        field: 'email',
        message: 'Email must be less than 255 characters',
        code: 'TOO_LONG',
      });
    }

    // Check for allowed domains (optional business rule)
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
    if (allowedDomains.length > 0) {
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain && !allowedDomains.includes(domain)) {
        errors.push({
          field: 'email',
          message: `Email domain not allowed. Allowed domains: ${allowedDomains.join(', ')}`,
          code: 'DOMAIN_NOT_ALLOWED',
        });
      }
    }

    return errors;
  }

  /**
   * Validate password strength and rules
   */
  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!password) {
      errors.push({
        field: 'senha',
        message: 'Password is required',
        code: 'REQUIRED',
      });
      return errors;
    }

    // Minimum length check
    if (password.length < 8) {
      errors.push({
        field: 'senha',
        message: 'Password must be at least 8 characters long',
        code: 'TOO_SHORT',
      });
    }

    // Maximum length check
    if (password.length > 128) {
      errors.push({
        field: 'senha',
        message: 'Password must be less than 128 characters',
        code: 'TOO_LONG',
      });
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      errors.push({
        field: 'senha',
        message: 'Password must contain at least one letter',
        code: 'MISSING_LETTER',
      });
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      errors.push({
        field: 'senha',
        message: 'Password must contain at least one number',
        code: 'MISSING_NUMBER',
      });
    }

    // Check for at least one special character (optional, configurable)
    const requireSpecialChar = process.env.REQUIRE_SPECIAL_CHAR === 'true';
    if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push({
        field: 'senha',
        message: 'Password must contain at least one special character',
        code: 'MISSING_SPECIAL_CHAR',
      });
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password',
      '12345678',
      'qwerty123',
      'admin123',
      'password123',
      'abcd1234',
      'teste123',
      'senha123',
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      errors.push({
        field: 'senha',
        message: 'Password is too weak. Please choose a stronger password',
        code: 'WEAK_PASSWORD',
      });
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      errors.push({
        field: 'senha',
        message: 'Password cannot contain sequential characters (e.g., 123, abc)',
        code: 'SEQUENTIAL_CHARS',
      });
    }

    // Check for repeated characters
    if (this.hasRepeatedChars(password)) {
      errors.push({
        field: 'senha',
        message: 'Password cannot contain more than 2 repeated characters in sequence',
        code: 'REPEATED_CHARS',
      });
    }

    return errors;
  }

  /**
   * Validate user name
   */
  static validateName(nome: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!nome) {
      errors.push({
        field: 'nome',
        message: 'Name is required',
        code: 'REQUIRED',
      });
      return errors;
    }

    // Check name length
    if (nome.length < 2) {
      errors.push({
        field: 'nome',
        message: 'Name must be at least 2 characters long',
        code: 'TOO_SHORT',
      });
    }

    if (nome.length > 255) {
      errors.push({
        field: 'nome',
        message: 'Name must be less than 255 characters',
        code: 'TOO_LONG',
      });
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(nome)) {
      errors.push({
        field: 'nome',
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
        code: 'INVALID_CHARACTERS',
      });
    }

    // Check for excessive spaces
    if (/\s{2,}/.test(nome)) {
      errors.push({
        field: 'nome',
        message: 'Name cannot contain multiple consecutive spaces',
        code: 'EXCESSIVE_SPACES',
      });
    }

    return errors;
  }

  /**
   * Validate user role
   */
  static validateRole(papel: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!papel) {
      errors.push({
        field: 'papel',
        message: 'Role is required',
        code: 'REQUIRED',
      });
      return errors;
    }

    const validRoles: TipoPapel[] = ['admin', 'tecnico', 'gestor'];
    if (!validRoles.includes(papel as TipoPapel)) {
      errors.push({
        field: 'papel',
        message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`,
        code: 'INVALID_ROLE',
      });
    }

    return errors;
  }

  /**
   * Validate complete user data for creation
   */
  static validateUserCreation(userData: {
    nome: string;
    email: string;
    senha: string;
    papel: string;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    errors.push(...this.validateName(userData.nome));
    errors.push(...this.validateEmail(userData.email));
    errors.push(...this.validatePassword(userData.senha));
    errors.push(...this.validateRole(userData.papel));

    return errors;
  }

  /**
   * Validate user data for update
   */
  static validateUserUpdate(userData: {
    nome?: string;
    email?: string;
    senha?: string;
    papel?: string;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    if (userData.nome !== undefined) {
      errors.push(...this.validateName(userData.nome));
    }

    if (userData.email !== undefined) {
      errors.push(...this.validateEmail(userData.email));
    }

    if (userData.senha !== undefined) {
      errors.push(...this.validatePassword(userData.senha));
    }

    if (userData.papel !== undefined) {
      errors.push(...this.validateRole(userData.papel));
    }

    return errors;
  }

  /**
   * Check for sequential characters in password
   */
  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (password.toLowerCase().includes(subseq)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for repeated characters in password
   */
  private static hasRepeatedChars(password: string): boolean {
    let count = 1;
    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        count++;
        if (count > 2) {
          return true;
        }
      } else {
        count = 1;
      }
    }
    return false;
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[<>]/g, ''); // Remove potential XSS characters
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: string | number, limit?: string | number): {
    page: number;
    limit: number;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];
    let validPage = 1;
    let validLimit = 10;

    // Validate page
    if (page !== undefined) {
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push({
          field: 'page',
          message: 'Page must be a positive integer',
          code: 'INVALID_PAGE',
        });
      } else {
        validPage = pageNum;
      }
    }

    // Validate limit
    if (limit !== undefined) {
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push({
          field: 'limit',
          message: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT',
        });
      } else {
        validLimit = limitNum;
      }
    }

    return {
      page: validPage,
      limit: validLimit,
      errors,
    };
  }

  /**
   * Check if validation has errors
   */
  static hasErrors(errors: ValidationError[]): boolean {
    return errors.length > 0;
  }

  /**
   * Format validation errors for API response
   */
  static formatErrors(errors: ValidationError[]): {
    message: string;
    errors: { [key: string]: string[] };
  } {
    const groupedErrors: { [key: string]: string[] } = {};
    
    errors.forEach(error => {
      if (!groupedErrors[error.field]) {
        groupedErrors[error.field] = [];
      }
      groupedErrors[error.field].push(error.message);
    });

    return {
      message: 'Validation failed',
      errors: groupedErrors,
    };
  }
}