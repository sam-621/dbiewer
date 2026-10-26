import { describe, expect, test } from 'vitest';

import { SecretDecryptionFailedError } from './encryption-errors';
import { EncryptionService } from './encryption-service';

const encryptionService = new EncryptionService('Ap8+HgfC4cuwGb1n3x+JgBcaTsA/tpXSaz0TZXDjhLU=');

describe('EncryptionService', () => {
  test('returns the plaintext after encrypting and decrypting it', () => {
    const ciphertext = encryptionService.encrypt('super-secret-password', 'connection-id');

    expect(encryptionService.decrypt(ciphertext, 'connection-id')).toBe('super-secret-password');
  });

  test('returns the value in the v1 format', () => {
    const ciphertext = encryptionService.encrypt('super-secret-password', 'connection-id');

    expect(ciphertext).toMatch(/^v1:[A-Za-z0-9+/=]{16}:[A-Za-z0-9+/=]{24}:[A-Za-z0-9+/=]+$/);
  });

  test('does not repeat the iv between encryptions of the same plaintext', () => {
    const first = encryptionService.encrypt('super-secret-password', 'connection-id');
    const second = encryptionService.encrypt('super-secret-password', 'connection-id');

    expect(first.split(':')[1]).not.toBe(second.split(':')[1]);
    expect(first).not.toBe(second);
  });

  test('throws when the associated data is different', () => {
    const ciphertext = encryptionService.encrypt('super-secret-password', 'connection-id');

    expect(() => encryptionService.decrypt(ciphertext, 'other-connection-id')).toThrow(
      SecretDecryptionFailedError
    );
  });

  test('throws when the ciphertext is tampered', () => {
    const [version, iv, authTag, encrypted] = encryptionService
      .encrypt('super-secret-password', 'connection-id')
      .split(':');
    const tampered = Buffer.from(encrypted ?? '', 'base64');
    tampered[0] = (tampered[0] ?? 0) ^ 1;

    expect(() =>
      encryptionService.decrypt(
        [version, iv, authTag, tampered.toString('base64')].join(':'),
        'connection-id'
      )
    ).toThrow(SecretDecryptionFailedError);
  });

  test('throws when the version is unknown', () => {
    const ciphertext = encryptionService
      .encrypt('super-secret-password', 'connection-id')
      .replace(/^v1:/, 'v2:');

    expect(() => encryptionService.decrypt(ciphertext, 'connection-id')).toThrow(
      SecretDecryptionFailedError
    );
  });

  test('throws when the value does not have the format', () => {
    expect(() => encryptionService.decrypt('not-a-secret', 'connection-id')).toThrow(
      SecretDecryptionFailedError
    );
  });
});
