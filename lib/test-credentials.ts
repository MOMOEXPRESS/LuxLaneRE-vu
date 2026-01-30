/**
 * Single source of truth for seeded test accounts.
 * Password for ALL accounts below is TEST_PASSWORD.
 * Use these exactly (copy-paste) to log in after running the seed.
 */

export const TEST_PASSWORD = "password123"

export const TEST_ACCOUNTS = {
  brands: [
    { email: "dior@luxlane.demo", username: "dior" },
    { email: "gucci@luxlane.demo", username: "gucci" },
    { email: "chanel@luxlane.demo", username: "chanel" },
  ],
  agencies: [
    { email: "elite@luxlane.demo", username: "eliteagency" },
    { email: "next@luxlane.demo", username: "nextagency" },
    { email: "img@luxlane.demo", username: "imgmodels" },
  ],
  models: [
    { email: "sofia@luxlane.demo", username: "sofia" },
    { email: "lina@luxlane.demo", username: "lina" },
    { email: "maya@luxlane.demo", username: "maya" },
    { email: "emma@luxlane.demo", username: "emma" },
    { email: "chiara@luxlane.demo", username: "chiara" },
    { email: "zoe@luxlane.demo", username: "zoe" },
    { email: "anna@luxlane.demo", username: "anna" },
    { email: "lea@luxlane.demo", username: "lea" },
    { email: "nina@luxlane.demo", username: "nina" },
    { email: "jade@luxlane.demo", username: "jade" },
    { email: "luna@luxlane.demo", username: "luna" },
    { email: "sasha@luxlane.demo", username: "sasha" },
  ],
} as const

/** Example login (use in UI/docs): sofia@luxlane.demo / password123 */
export const EXAMPLE_LOGIN = {
  email: "sofia@luxlane.demo",
  password: TEST_PASSWORD,
} as const
