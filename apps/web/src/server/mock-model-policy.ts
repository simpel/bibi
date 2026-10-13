export type MockModelPolicyInput = { flag: boolean; nodeEnv: string };

/** The scripted E2E model is only ever allowed outside production (the flag is ignored there). */
export function shouldUseMockModel({ flag, nodeEnv }: MockModelPolicyInput): boolean {
  return flag && nodeEnv !== "production";
}
