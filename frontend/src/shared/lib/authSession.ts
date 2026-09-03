let configuredToken: string | null = null;

export function configureAuthToken(token: string | null): void {
  configuredToken = token;
}

export async function getAuthToken(): Promise<string | null> {
  if (process.env.NODE_ENV === "development") {
    return "development-user";
  }

  return configuredToken;
}
