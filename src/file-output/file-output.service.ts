// src/common/file-output.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class FileOutputService {
  private readonly logger = new Logger(FileOutputService.name);

  async saveJsonOutput(fileName: string, jsonData: any): Promise<void> {
    // Define the output directory. You can change 'output' to any folder name.
    // Here, we assume an 'output' folder at the project root.
    const outputDir = join(__dirname, '..', '..', 'src', 'output');

    // Create the directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // // Build the full file path
    const filePath = join(outputDir, fileName);

    // Write the JSON data to the file with pretty-print formatting
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    this.logger.log(`JSON output saved to ${filePath}`);
  }
}
