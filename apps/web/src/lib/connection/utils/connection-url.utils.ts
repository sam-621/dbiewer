const PROTOCOLS = ['postgres:', 'postgresql:'];
const SSL_MODES = ['disable', 'require', 'verify-full'] as const;

export type ConnectionUrlSslMode = (typeof SSL_MODES)[number];

export type ParsedConnectionUrl = {
  username?: string;
  password?: string;
  host: string;
  port?: number;
  database?: string;
  sslMode?: ConnectionUrlSslMode;
};

export const parseConnectionUrl = (url: string): ParsedConnectionUrl | null => {
  try {
    const parsed = new URL(url.trim());

    if (!PROTOCOLS.includes(parsed.protocol) || !parsed.hostname) return null;

    const sslMode = parsed.searchParams.get('sslmode');

    return {
      username: decode(parsed.username),
      password: decode(parsed.password),
      host: decodeURIComponent(parsed.hostname),
      port: parsed.port ? Number(parsed.port) : undefined,
      database: decode(parsed.pathname.slice(1)),
      sslMode: isSslMode(sslMode) ? sslMode : undefined
    };
  } catch {
    return null;
  }
};

const decode = (value: string) => (value ? decodeURIComponent(value) : undefined);

const isSslMode = (value: string | null): value is ConnectionUrlSslMode =>
  SSL_MODES.some(sslMode => sslMode === value);
