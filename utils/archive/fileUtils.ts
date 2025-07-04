/**
 * Validates if a file is of an accepted type
 */
export const isValidFileType = (file: File, acceptedTypes: string[]): boolean => {
  // Get file extension
  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Check if file extension is in the accepted types list
  return acceptedTypes.some(type => {
    // Handle MIME types or extensions
    if (type.startsWith('.')) {
      return type.toLowerCase() === `.${fileExt}`;
    } else {
      return type === file.type;
    }
  });
};

/**
 * Validates file size
 */
export const isValidFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Extracts text content from a text file
 */
export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};
