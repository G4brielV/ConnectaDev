type InvalidationListener = () => void;

const listeners = new Set<InvalidationListener>();

export function invalidateJobRecommendations(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToJobRecommendationsInvalidation(
  listener: InvalidationListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
