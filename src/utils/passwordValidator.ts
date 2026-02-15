import bcrypt from 'bcrypt';

export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly COMMON_PASSWORDS = [
    'password', '12345678', 'qwerty', 'admin123', 'letmein',
    'welcome', 'monkey', '1234567890', 'password123',
  ];

  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
    }

    if (/^[0-9]+$/.test(password)) {
      errors.push('Password cannot contain only numbers');
    }

    if (this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a stronger password');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static async isSameAsOld(newPassword: string, oldHash: string): Promise<boolean> {
    return await bcrypt.compare(newPassword, oldHash);
  }

  private static isCommonPassword(password: string): boolean {
    return this.COMMON_PASSWORDS.includes(password.toLowerCase());
  }
}
