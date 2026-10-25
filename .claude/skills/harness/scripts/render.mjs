import { readFileSync } from 'node:fs';
import { argv, exit, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';

const INLINE = /<!-- si: ([^>]*?) -->([^\n]*?)<!-- \/si -->/g;
const BLOCK = /^<!-- si: ([^>]*?) -->[ \t]*\n([\s\S]*?)^<!-- \/si -->[ \t]*\n?/gm;
const TOKEN = /\{\{(\w+)\}\}/g;

const ALIASES = { comments: 'style.comments' };
const UI_LANGUAGES = { es: 'español', en: 'inglés' };

const lookup = (key, app, manifest) => {
  const path = (ALIASES[key] ?? key).split('.');

  for (const source of [app ?? {}, manifest]) {
    let value = source;

    for (const part of path) {
      value = value && typeof value === 'object' ? value[part] : undefined;
    }

    if (value !== undefined && value !== null) return value;
  }

  return undefined;
};

const asText = value => (value === undefined || value === null ? '' : String(value));

const truthy = value => (Array.isArray(value) ? value.length > 0 : Boolean(value) && value !== 'none');

const check = (term, app, manifest) => {
  const t = term.trim();

  if (t.startsWith('!') && !t.includes('=')) return !truthy(lookup(t.slice(1), app, manifest));

  if (t.includes('!=')) {
    const [key, values] = t.split('!=');
    return !values.split('|').includes(asText(lookup(key, app, manifest)));
  }

  if (t.includes('=')) {
    const [key, values] = t.split('=');
    return values.split('|').includes(asText(lookup(key, app, manifest)));
  }

  return truthy(lookup(t, app, manifest));
};

const condition = (expr, app, manifest) => expr.split(' y ').every(term => check(term, app, manifest));

const pascal = name =>
  name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join('');

const appPath = app => `${asText(app.location) || 'apps'}/${app.name}`;

const tokens = (manifest, app) => {
  const apps = manifest.apps;
  const pm = asText(manifest.packageManager) || 'yarn';
  const backends = apps.filter(a => a.kind === 'backend');
  const frontends = apps.filter(a => a.kind === 'frontend');
  const projectPascal = pascal(manifest.project);

  const values = {
    project: manifest.project,
    Project: asText(manifest.displayName) || projectPascal,
    ProjectPascal: projectPascal,
    description: asText(manifest.description),
    pm,
    run: pm === 'npm' ? 'npm run' : pm,
    BaseError: `${projectPascal}Error`,
    apps_table: apps
      .map(a => `| \`${appPath(a)}\` | ${asText(a.description)} | ${asText(a.stack)} |`)
      .join('\n'),
    app_scopes: apps.map(a => `\`${a.name}\``).join(', '),
    example_app: (backends[0] ?? apps[0]).name,
    example_frontend: (frontends[0] ?? apps[0]).name
  };

  if (app) {
    const uiLanguage = asText(app.uiLanguage) || 'es';

    Object.assign(values, {
      app: app.name,
      app_path: appPath(app),
      app_description: asText(app.description),
      app_purpose: asText(app.purpose) || asText(app.description),
      app_stack: asText(app.stack),
      backend_app: asText(app.backend) || (backends[0]?.name ?? ''),
      ui_language: UI_LANGUAGES[uiLanguage] ?? uiLanguage
    });
  }

  return values;
};

export const render = (text, manifest, app) => {
  const values = tokens(manifest, app);

  return text
    .replace(INLINE, (_m, expr, body) => (condition(expr, app, manifest) ? body : ''))
    .replace(BLOCK, (_m, expr, body) => (condition(expr, app, manifest) ? body : ''))
    .replace(TOKEN, (m, key) => values[key] ?? m)
    .replace(/\n{3,}/g, '\n\n');
};

const main = () => {
  const [manifestPath, filePath, appName] = argv.slice(2);

  if (!manifestPath || !filePath) {
    console.error('uso: node render.mjs <harness.json> <archivo> [app]');
    exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const app = appName ? manifest.apps.find(a => a.name === appName) : null;

  if (app === undefined) {
    console.error(`no existe la app ${appName} en el manifiesto`);
    exit(1);
  }

  stdout.write(render(readFileSync(filePath, 'utf8'), manifest, app));
};

if (import.meta.url === pathToFileURL(argv[1]).href) main();
