import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'fleet-assets';

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be defined in the configuration',
      );
    }

    this.supabase = createClient(url, key);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExt}`;
    const filePath = fileName;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: publicData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }

  async deleteFileByUrl(url: string): Promise<void> {
    if (!url) return;
    try {
      const marker = `/${this.bucketName}/`;
      const index = url.indexOf(marker);
      if (index === -1) return;
      const filePath = url.substring(index + marker.length);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error(`Failed to delete file from Supabase storage: ${url}`, e);
    }
  }
}
