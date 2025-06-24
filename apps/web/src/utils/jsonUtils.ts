/**
 * Utility functions for handling large JSON data in the UI
 */

interface TruncationOptions {
  maxStringLength?: number;
  maxArrayPreview?: number;
  detectBase64?: boolean;
  detectImages?: boolean;
}

const DEFAULT_OPTIONS: Required<TruncationOptions> = {
  maxStringLength: 200,
  maxArrayPreview: 3,
  detectBase64: true,
  detectImages: true,
};

/**
 * Detects if a string is likely base64 encoded
 */
function isBase64String(str: string): boolean {
  if (str.length < 100) return false; // Too short to be meaningful base64
  
  // Check for base64 pattern and reasonable length
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str) && str.length > 1000;
}

/**
 * Detects if a string is likely an image (base64 or data URL)
 */
function isImageString(str: string): boolean {
  if (str.startsWith('data:image/')) return true;
  if (str.startsWith('iVBORw0KGgo')) return true; // PNG header in base64
  if (str.startsWith('/9j/')) return true; // JPEG header in base64
  return false;
}

/**
 * Creates a smart truncation of a string based on its content type
 */
function truncateString(str: string, options: Required<TruncationOptions>): string {
  if (str.length <= options.maxStringLength) {
    return str;
  }

  const preview = str.substring(0, options.maxStringLength);
  let suffix = `... [TRUNCATED - ${str.length.toLocaleString()} chars]`;

  if (options.detectImages && isImageString(str)) {
    suffix = `... [IMAGE DATA - ${(str.length / 1024).toFixed(1)}KB]`;
  } else if (options.detectBase64 && isBase64String(str)) {
    suffix = `... [BASE64 DATA - ${(str.length / 1024).toFixed(1)}KB]`;
  }

  return preview + suffix;
}

/**
 * Recursively truncates large strings in an object while preserving structure
 */
export function truncateLargeContent(
  obj: any,
  options: TruncationOptions = {}
): any {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (typeof obj === 'string') {
    return truncateString(obj, opts);
  }

  if (Array.isArray(obj)) {
    if (obj.length <= opts.maxArrayPreview) {
      return obj.map(item => truncateLargeContent(item, options));
    }
    
    // Show preview of large arrays
    const preview = obj.slice(0, opts.maxArrayPreview).map(item => 
      truncateLargeContent(item, options)
    );
    preview.push(`... [${obj.length - opts.maxArrayPreview} more items]`);
    return preview;
  }

  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = truncateLargeContent(value, options);
    }
    return result;
  }

  return obj;
}

/**
 * Formats JSON with syntax highlighting classes
 */
export function formatJsonWithHighlighting(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Calculates the size of a JSON object in bytes
 */
export function calculateJsonSize(obj: any): number {
  return new Blob([JSON.stringify(obj)]).size;
}

/**
 * Gets statistics about a JSON object
 */
export function getJsonStats(obj: any): {
  totalSize: number;
  totalSizeFormatted: string;
  lineCount: number;
  truncatedStrings: number;
  imageDataSize: number;
} {
  const jsonString = JSON.stringify(obj, null, 2);
  const totalSize = new Blob([jsonString]).size;
  const lineCount = jsonString.split('\n').length;
  
  // Count truncated content
  const truncatedMatches = jsonString.match(/\[TRUNCATED - [\d,]+ chars\]/g) || [];
  const imageMatches = jsonString.match(/\[IMAGE DATA - [\d.]+KB\]/g) || [];
  const truncatedStrings = truncatedMatches.length + imageMatches.length;
  
  // Estimate image data size
  let imageDataSize = 0;
  imageMatches.forEach(match => {
    const sizeMatch = match.match(/[\d.]+KB/);
    if (sizeMatch) {
      imageDataSize += parseFloat(sizeMatch[0].replace('KB', '')) * 1024;
    }
  });

  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    lineCount,
    truncatedStrings,
    imageDataSize,
  };
}

/**
 * Formats bytes into human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}