import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { SecretDecryptionFailedError } from './encryption-errors';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class EncryptionService {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, 'base64');
  }

  encrypt(plaintext: string, associatedData: string) {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    cipher.setAAD(Buffer.from(associatedData, 'utf8'));

    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      VERSION,
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64')
    ].join(':');
  }

  decrypt(ciphertext: string, associatedData: string) {
    const parts = ciphertext.split(':');
    const [version, ivPart, authTagPart, ciphertextPart] = parts;
    if (
      parts.length !== 4 ||
      ivPart === undefined ||
      authTagPart === undefined ||
      ciphertextPart === undefined
    ) {
      throw new SecretDecryptionFailedError('invalid format');
    }
    if (version !== VERSION) throw new SecretDecryptionFailedError(`unknown version ${version}`);

    const iv = Buffer.from(ivPart, 'base64');
    const authTag = Buffer.from(authTagPart, 'base64');
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new SecretDecryptionFailedError('invalid format');
    }

    try {
      const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
        authTagLength: AUTH_TAG_LENGTH
      });
      decipher.setAAD(Buffer.from(associatedData, 'utf8'));
      decipher.setAuthTag(authTag);

      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, 'base64')),
        decipher.final()
      ]).toString('utf8');
    } catch {
      throw new SecretDecryptionFailedError('authentication failed');
    }
  }
}
