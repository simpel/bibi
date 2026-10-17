"use client";

import { useCallback, useState } from "react";
import { listSkillOptionsAction, type SkillOption } from "../skill-actions";

/** The pickable skills, loaded each time `load` is called (when the picker opens). */
export function useSkillOptions() {
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    const result = await listSkillOptionsAction();
    setFailed(!result.ok);
    if (result.ok) setSkills(result.value);
  }, []);
  return { skills, failed, load };
}
