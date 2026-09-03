let configuredToken: string | null = null;

export function configureAuthToken(token: string | null): void {
  configuredToken = token;
}

export async function getAuthToken(): Promise<string | null> {
  if (process.env.EXPO_PUBLIC_ALLOW_QUIZ_WITHOUT_AUTH === "true") {
    return "development-bypass";
  }

  return configuredToken;
}
