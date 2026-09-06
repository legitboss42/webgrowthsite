export type SchedulerUserIdentity = {
  id: string;
  tiktok_open_id: string;
  status: string;
};

export function parseOwnerOpenIds(value: string | undefined) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of (value || "").split(",")) {
    const openId = item.trim();
    if (!openId || seen.has(openId)) continue;
    seen.add(openId);
    result.push(openId);
  }
  return result;
}

export function selectOwnerSchedulerUser(
  rows: SchedulerUserIdentity[],
  ownerOpenIds: string[]
): SchedulerUserIdentity | null {
  const allowed = new Set(ownerOpenIds);
  const matches = rows.filter(
    (row) => row.status === "ACTIVE" && allowed.has(row.tiktok_open_id)
  );
  return matches.length === 1 ? matches[0] : null;
}
