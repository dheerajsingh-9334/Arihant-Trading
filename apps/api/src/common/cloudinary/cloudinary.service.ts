import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';

export interface CloudinarySignedParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {}

  generateSignedUploadParameters(customFolder?: string): CloudinarySignedParams {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || 'arihant-trading';
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') || '123456789012345';
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET') || 'abcdefghijklmnopqrstuvwxyz12345';
    const folder = customFolder || this.configService.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'arihant-bos';

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Cloudinary signature format: sort params alphabetically, join with &, append secret, sha1 hash
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const stringToSign = `${paramsToSign}${apiSecret}`;

    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    return {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
    };
  }
}
