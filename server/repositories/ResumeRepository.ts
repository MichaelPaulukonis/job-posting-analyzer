import { FileStorageService } from '../services/FileStorageService';

export interface SavedResume {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export class ResumeRepository extends FileStorageService<SavedResume> {
  constructor() {
    super('resumes.json');
  }
}

// Create a singleton instance
const resumeRepository = new ResumeRepository();
export default resumeRepository;
