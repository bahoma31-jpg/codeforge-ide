/**
 * File Validation Utilities
 * Validates file names, sizes, and content before operations
 */

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

// File system constraints
const MAX_FILE_NAME_LENGTH = 255;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PATH_LENGTH = 4096;

// Invalid characters in file names (Windows + Unix)
const INVALID_FILENAME_CHARS = /[\/:*?"<>|\x00-\x1f\x80-\x9f]/;

// Reserved Windows file names
const RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
];

// Common dangerous file extensions
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
  '.vbs', '.js', '.jar', '.msi', '.app', '.deb', '.rpm',
];

/**
 * Validate file name
 */
export function validateFileName(name: string): ValidationResult {
  // Check if empty
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      error: 'File name cannot be empty',
    };
  }

  // Check length
  if (name.length > MAX_FILE_NAME_LENGTH) {
    return {
      isValid: false,
      error: `File name is too long (max ${MAX_FILE_NAME_LENGTH} characters)`,
    };
  }

  // Check for invalid characters
  if (INVALID_FILENAME_CHARS.test(name)) {
    return {
      isValid: false,
      error: 'File name contains invalid characters: / \\ : * ? " < > |',
    };
  }

  // Check for leading/trailing spaces or dots
  if (name !== name.trim()) {
    return {
      isValid: false,
      error: 'File name cannot start or end with spaces',
    };
  }

  if (name.startsWith('.') && name !== '.gitignore' && name !== '.env') {
    return {
      isValid: false,
      error: 'File name cannot start with a dot (except .gitignore, .env)',
    };
  }

  if (name.endsWith('.')) {
    return {
      isValid: false,
      error: 'File name cannot end with a dot',
    };
  }

  // Check for reserved names (Windows)
  const nameWithoutExt = name.split('.')[0].toUpperCase();
  if (RESERVED_NAMES.includes(nameWithoutExt)) {
    return {
      isValid: false,
      error: `"${name}" is a reserved file name`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): ValidationResult {
  if (size < 0) {
    return {
      isValid: false,
      error: 'Invalid file size',
    };
  }

  if (size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `File is too large (max ${maxSizeMB}MB)`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Validate file path
 */
export function validateFilePath(path: string): ValidationResult {
  if (!path || path.trim() === '') {
    return {
      isValid: false,
      error: 'File path cannot be empty',
    };
  }

  if (path.length > MAX_PATH_LENGTH) {
    return {
      isValid: false,
      error: `File path is too long (max ${MAX_PATH_LENGTH} characters)`,
    };
  }

  // Check for path traversal attempts
  if (path.includes('..')) {
    return {
      isValid: false,
      error: 'File path cannot contain ".." (path traversal)',
    };
  }

  // Validate each segment of the path
  const segments = path.split('/');
  for (const segment of segments) {
    if (segment === '') continue; // Allow leading/trailing slashes
    
    const result = validateFileName(segment);
    if (!result.isValid) {
      return result;
    }
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Check if file extension is potentially dangerous
 */
export function isDangerousExtension(fileName: string): boolean {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Validate file content type
 */
export function validateFileType(
  fileName: string,
  allowedExtensions?: string[]
): ValidationResult {
  if (!allowedExtensions || allowedExtensions.length === 0) {
    return { isValid: true, error: null };
  }

  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `File type "${ext}" is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  fileName: string,
  fileSize: number,
  options?: {
    allowedExtensions?: string[];
    checkDangerous?: boolean;
  }
): ValidationResult {
  // Validate file name
  const nameResult = validateFileName(fileName);
  if (!nameResult.isValid) {
    return nameResult;
  }

  // Validate file size
  const sizeResult = validateFileSize(fileSize);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  // Check for dangerous extensions
  if (options?.checkDangerous && isDangerousExtension(fileName)) {
    return {
      isValid: false,
      error: 'File type is not allowed for security reasons',
    };
  }

  // Validate file type
  if (options?.allowedExtensions) {
    const typeResult = validateFileType(fileName, options.allowedExtensions);
    if (!typeResult.isValid) {
      return typeResult;
    }
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Sanitize file name by removing/replacing invalid characters
 */
export function sanitizeFileName(name: string): string {
  // Replace invalid characters with underscore
  let sanitized = name.replace(INVALID_FILENAME_CHARS, '_');
  
  // Trim spaces and dots
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');
  
  // Limit length
  if (sanitized.length > MAX_FILE_NAME_LENGTH) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    const maxNameLength = MAX_FILE_NAME_LENGTH - ext.length;
    sanitized = nameWithoutExt.substring(0, maxNameLength) + ext;
  }
  
  // Handle reserved names
  const nameWithoutExt = sanitized.split('.')[0].toUpperCase();
  if (RESERVED_NAMES.includes(nameWithoutExt)) {
    sanitized = '_' + sanitized;
  }
  
  return sanitized;
}

/**
 * Check if path is safe (no traversal, absolute paths, etc.)
 */
export function isSafePath(path: string): boolean {
  // No path traversal
  if (path.includes('..')) return false;
  
  // No absolute paths
  if (path.startsWith('/') || /^[a-zA-Z]:\\/.test(path)) return false;
  
  // No special characters in path
  if (/[\x00-\x1f\x80-\x9f]/.test(path)) return false;
  
  return true;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Get file extension from file name
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return '';
  }
  return fileName.substring(lastDot);
}

/**
 * Check if file is a text file based on extension
 */
export function isTextFile(fileName: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.json', '.xml', '.yaml', '.yml',
    '.js', '.ts', '.jsx', '.tsx', '.css', '.scss',
    '.html', '.htm', '.py', '.java', '.c', '.cpp',
    '.h', '.sh', '.bash', '.sql', '.go', '.rs',
    '.php', '.rb', '.swift', '.kt', '.cs',
  ];
  
  const ext = getFileExtension(fileName).toLowerCase();
  return textExtensions.includes(ext);
}
