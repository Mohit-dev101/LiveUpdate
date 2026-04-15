const requiredServerEnv = ["API_PROXY_TARGET"];

function readServerEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getServerEnv() {
  const values = Object.fromEntries(requiredServerEnv.map((name) => [name, readServerEnv(name)]));

  return {
    apiProxyTarget: values.API_PROXY_TARGET.replace(/\/$/, "")
  };
}

export function getClientEnv() {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || "Live CRUD Workspace"
  };
}
