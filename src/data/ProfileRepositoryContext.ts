import { createContext, useContext } from 'react';
import type { ProfileRepository } from './ProfileRepository';

export const ProfileRepositoryContext = createContext<ProfileRepository | null>(null);

/** The bound repository; state holders use it, components never do. */
export function useProfileRepository(): ProfileRepository {
  const repository = useContext(ProfileRepositoryContext);
  if (!repository) {
    throw new Error('useProfileRepository must be used inside ProfileRepositoryContext');
  }
  return repository;
}
