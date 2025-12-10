/**
 * Input Validation Utilities
 * Provides client-side validation matching backend constraints
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Username validation (must match backend: 3-30 chars, alphanumeric + _ or -)
export function validateUsername(username: string): ValidationResult {
  const trimmed = username.trim();

  if (!trimmed) {
    return { valid: false, error: 'Le nom d\'utilisateur est requis' };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères' };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { valid: false, error: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ ou -' };
  }

  return { valid: true };
}

// Email validation (must match backend: valid format, max 254 chars)
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, error: 'L\'email est requis' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'L\'email ne peut pas dépasser 254 caractères' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }

  return { valid: true };
}

// Display name validation (must match backend: 1-50 chars)
export function validateDisplayName(displayName: string): ValidationResult {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return { valid: false, error: 'Le nom d\'affichage est requis' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Le nom d\'affichage ne peut pas dépasser 50 caractères' };
  }

  return { valid: true };
}

// Password validation (must match backend: 8-128 chars)
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Le mot de passe est requis' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Le mot de passe ne peut pas dépasser 128 caractères' };
  }

  return { valid: true };
}

// Password confirmation validation
export function validatePasswordConfirm(password: string, passwordConfirm: string): ValidationResult {
  if (!passwordConfirm) {
    return { valid: false, error: 'La confirmation du mot de passe est requise' };
  }

  if (password !== passwordConfirm) {
    return { valid: false, error: 'Les mots de passe ne correspondent pas' };
  }

  return { valid: true };
}

// Chat message validation (must match backend: max 2000 chars)
export function validateChatMessage(message: string): ValidationResult {
  const trimmed = message.trim();

  if (!trimmed) {
    return { valid: false, error: 'Le message ne peut pas être vide' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Le message ne peut pas dépasser 2000 caractères' };
  }

  return { valid: true };
}

// Tournament alias validation (similar to display name but for tournaments)
export function validateTournamentAlias(alias: string): ValidationResult {
  const trimmed = alias.trim();

  if (!trimmed) {
    return { valid: false, error: 'L\'alias est requis' };
  }

  if (trimmed.length < 1) {
    return { valid: false, error: 'L\'alias doit contenir au moins 1 caractère' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'L\'alias ne peut pas dépasser 30 caractères' };
  }

  // Only allow safe characters for tournament display
  const aliasRegex = /^[a-zA-Z0-9_\-\s]+$/;
  if (!aliasRegex.test(trimmed)) {
    return { valid: false, error: 'L\'alias ne peut contenir que des lettres, chiffres, espaces, _ ou -' };
  }

  return { valid: true };
}

// Room code validation (must be 6 alphanumeric characters)
export function validateRoomCode(code: string): ValidationResult {
  const trimmed = code.trim().toUpperCase();

  if (!trimmed) {
    return { valid: false, error: 'Le code de la salle est requis' };
  }

  if (trimmed.length !== 6) {
    return { valid: false, error: 'Le code de la salle doit contenir exactement 6 caractères' };
  }

  const codeRegex = /^[A-Z0-9]+$/;
  if (!codeRegex.test(trimmed)) {
    return { valid: false, error: 'Le code de la salle ne peut contenir que des lettres et chiffres' };
  }

  return { valid: true };
}

// Full registration form validation
export function validateRegistrationForm(data: {
  username: string;
  email: string;
  displayName: string;
  password: string;
  passwordConfirm: string;
}): ValidationResult {
  const usernameResult = validateUsername(data.username);
  if (!usernameResult.valid) return usernameResult;

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) return emailResult;

  const displayNameResult = validateDisplayName(data.displayName);
  if (!displayNameResult.valid) return displayNameResult;

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) return passwordResult;

  const confirmResult = validatePasswordConfirm(data.password, data.passwordConfirm);
  if (!confirmResult.valid) return confirmResult;

  return { valid: true };
}

// Full login form validation
export function validateLoginForm(data: {
  username: string;
  password: string;
}): ValidationResult {
  const trimmedUsername = data.username.trim();

  if (!trimmedUsername) {
    return { valid: false, error: 'Le nom d\'utilisateur est requis' };
  }

  if (!data.password) {
    return { valid: false, error: 'Le mot de passe est requis' };
  }

  return { valid: true };
}

// Utility to show validation error in a form
export function showValidationError(errorDiv: HTMLElement | null, message: string): void {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#ff4d4f';
  }
}

// Utility to clear validation error
export function clearValidationError(errorDiv: HTMLElement | null): void {
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }
}
