import { FileStorageService } from '../services/FileStorageService';

export interface CoverLetterSample {
  id: string;
  name: string;
  content: string;
  notes: string;
  timestamp: string;
}

export class CoverLetterSampleRepository extends FileStorageService<CoverLetterSample> {
  constructor() {
    super('cover-letter-samples.json');
  }
}

// Create a singleton instance
const coverLetterSampleRepository = new CoverLetterSampleRepository();
export default coverLetterSampleRepository;
