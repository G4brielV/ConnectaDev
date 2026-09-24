import { keyValueStorage } from './keyValueStorage';

const ONBOARDING_SEEN_KEY = 'connectadev_onboarding_seen';

export const onboardingStorage = {
  hasSeen: async (): Promise<boolean> =>
    (await keyValueStorage.getItem(ONBOARDING_SEEN_KEY)) === 'true',
  markSeen: () => keyValueStorage.setItem(ONBOARDING_SEEN_KEY, 'true'),
};
