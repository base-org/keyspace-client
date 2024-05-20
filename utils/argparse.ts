export function defaultToEnv(varName: string) {
  const value = process.env[varName];
  if (!value) {
    return { required: true };
  }
  return { default: value };
}
