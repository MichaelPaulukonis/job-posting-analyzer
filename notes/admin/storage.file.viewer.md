# Admin Storage File Viewer Implementation

## Overview

The Admin Storage File Viewer provides a web interface for viewing and inspecting the application's local storage files. It follows a client-server architecture pattern where the UI components make API requests to server endpoints that interact with the storage system.

Once other storage services are implemented, the viewer should be updated to display data from various sources, including local files, databases, and external APIs.

## Component Architecture

### Client-Side Components

1. **Admin Page (`/pages/admin.vue`)**:
   - Main container for the admin interface
   - Handles fetching the list of storage files
   - Contains controls for creating sample files
   - Displays debug information
   - Imports and renders the StorageFileViewer component for each file

2. **StorageFileViewer Component (`/components/admin/StorageFileViewer.vue`)**:
   - Responsible for displaying a single storage file
   - Implements collapsible UI pattern
   - Fetches file content via API when expanded
   - Formats and displays JSON content
   - Handles loading and error states

### Server-Side API Endpoints

1. **List Storage Files (`/server/api/admin/storage-files/index.ts`)**:
   - Returns a list of all JSON files in the `.data` directory
   - Uses Node.js filesystem APIs to read the directory contents

2. **Get File Content (`/server/api/admin/storage-files/[fileName].ts`)**:
   - Dynamic route that accepts a filename parameter
   - Uses FileStorageService to read the file content
   - Returns the file content as structured JSON
   - Includes security checks to prevent directory traversal

3. **Create Sample File (`/server/api/admin/storage-files/create-sample.ts`)**:
   - Creates a sample JSON file with test data
   - Uses FileStorageService to save the file
   - Returns success/failure information

## Data Flow

1. When the admin page loads, it calls the `/api/admin/storage-files` endpoint
2. The server responds with a list of available JSON files
3. The admin page renders a StorageFileViewer component for each file
4. When a user expands a file viewer, it calls `/api/admin/storage-files/{fileName}`
5. The server uses FileStorageService to read the file's content
6. The file content is returned to the client and displayed in the UI

## Storage Service Integration

The implementation follows clean architecture principles by:

1. **Separation of Concerns**:
   - UI components handle presentation only
   - API endpoints handle data access via FileStorageService
   - FileStorageService encapsulates file system operations

2. **Service-Based Architecture**:
   - FileStorageService provides a consistent interface for storage operations
   - Storage implementation details are hidden from API endpoints
   - UI is completely decoupled from storage implementation

## Security Considerations

1. **Path Validation**:
   - Filenames are validated to prevent directory traversal attacks
   - Only files with `.json` extension are allowed
   - Path manipulation attempts are rejected

2. **Error Handling**:
   - Server errors are logged but not exposed to clients
   - Structured error responses help with debugging
   - Client gracefully handles and displays errors

## Future Enhancements

1. **File Editing**:
   - Add ability to modify file contents
   - Implement validation for edited content

2. **File Operations**:
   - Support for creating new files
   - Ability to delete files
   - Import/export functionality

3. **Authentication**:
   - Restrict access to authenticated administrators
   - Add audit logging for file operations
