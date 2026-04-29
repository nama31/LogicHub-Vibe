// GET /users?role=courier&is_active=true

import type { User } from "@/types/user";

export function useCouriers(params?: { isActive?: boolean }) {
  // TODO: const { data, mutate } = useSWR<{ users: User[] }>(["/users", { role: "courier", ...params }], ...)
  return { couriers: [] as User[], isLoading: true };
}
