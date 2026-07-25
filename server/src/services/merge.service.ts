import { prisma } from "../prisma/client";

export type MergeResult =
  | { status: "invalid" }
  | { status: "progress"; newProvinceId: string; matchedCount: number; totalCount: number }
  | { status: "locked"; newProvinceId: string; newProvinceName: string; matchedCount: number; totalCount: number };

export async function validateMerge(provinceIds: string[]): Promise<MergeResult> {
  const uniqueIds = Array.from(new Set(provinceIds));
  if (uniqueIds.length === 0) {
    return { status: "invalid" };
  }

  const oldProvinces = await prisma.oldProvince.findMany({
    where: { id: { in: uniqueIds } },
    include: { newProvince: true },
  });

  if (oldProvinces.length !== uniqueIds.length) {
    return { status: "invalid" };
  }

  const newProvinceIds = new Set(oldProvinces.map((p) => p.newProvinceId));
  if (newProvinceIds.size !== 1) {
    return { status: "invalid" };
  }

  const newProvinceId = [...newProvinceIds][0];
  const fullGroup = await prisma.oldProvince.findMany({ where: { newProvinceId } });

  if (uniqueIds.length > fullGroup.length) {
    return { status: "invalid" };
  }

  if (uniqueIds.length === fullGroup.length) {
    const newProvince = oldProvinces[0].newProvince;
    return {
      status: "locked",
      newProvinceId,
      newProvinceName: newProvince.name,
      matchedCount: uniqueIds.length,
      totalCount: fullGroup.length,
    };
  }

  return {
    status: "progress",
    newProvinceId,
    matchedCount: uniqueIds.length,
    totalCount: fullGroup.length,
  };
}

export async function validateLevel1Complete(lockedNewProvinceIds: string[]) {
  const allNewProvinces = await prisma.newProvince.findMany({ select: { id: true } });
  const allIds = new Set(allNewProvinces.map((p) => p.id));
  const submitted = new Set(lockedNewProvinceIds);

  const missing = [...allIds].filter((id) => !submitted.has(id));
  return { complete: missing.length === 0, missingCount: missing.length, totalCount: allIds.size };
}
