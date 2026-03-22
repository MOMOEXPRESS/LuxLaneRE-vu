/**
 * Single source of truth for seeded test accounts.
 * Password for ALL accounts below is TEST_PASSWORD.
 * Use these exactly (copy-paste) to log in after running the seed.
 */

export const TEST_PASSWORD = "password123"

export const TEST_ACCOUNTS = {
  brands: [
    { email: "dior@luxlane.demo", username: "dior", name: "Maison Dior" },
    { email: "gucci@luxlane.demo", username: "gucci", name: "Gucci" },
    { email: "chanel@luxlane.demo", username: "chanel", name: "Chanel" },
    { email: "prada@luxlane.demo", username: "prada", name: "Prada" },
    { email: "burberry@luxlane.demo", username: "burberry", name: "Burberry" },
    { email: "versace@luxlane.demo", username: "versace", name: "Versace" },
    { email: "balenciaga@luxlane.demo", username: "balenciaga", name: "Balenciaga" },
    { email: "fendi@luxlane.demo", username: "fendi", name: "Fendi" },
    { email: "hermes@luxlane.demo", username: "hermes", name: "Hermès" },
    { email: "louisvuitton@luxlane.demo", username: "louisvuitton", name: "Louis Vuitton" },
  ],
  agencies: [
    { email: "elite@luxlane.demo", username: "eliteagency", name: "Elite Model Management" },
    { email: "next@luxlane.demo", username: "nextagency", name: "Next Models" },
    { email: "img@luxlane.demo", username: "imgmodels", name: "IMG Models" },
    { email: "wilhelmina@luxlane.demo", username: "wilhelmina", name: "Wilhelmina Models" },
    { email: "ford@luxlane.demo", username: "fordmodels", name: "Ford Models" },
    { email: "storm@luxlane.demo", username: "stormmodels", name: "Storm Model Management" },
    { email: "women@luxlane.demo", username: "womenmodels", name: "Women Management" },
    { email: "select@luxlane.demo", username: "selectmodel", name: "Select Model Management" },
    { email: "marilyn@luxlane.demo", username: "marilynagency", name: "Marilyn Agency" },
    { email: "dna@luxlane.demo", username: "dnamodels", name: "DNA Model Management" },
  ],
  models: [
    { email: "sofia@luxlane.demo", username: "sofia", name: "Sofia Laurent" },
    { email: "lina@luxlane.demo", username: "lina", name: "Lina Zhang" },
    { email: "maya@luxlane.demo", username: "maya", name: "Maya Williams" },
    { email: "emma@luxlane.demo", username: "emma", name: "Emma Lindberg" },
    { email: "chiara@luxlane.demo", username: "chiara", name: "Chiara Rossi" },
    { email: "zoe@luxlane.demo", username: "zoe", name: "Zoe Dubois" },
    { email: "anna@luxlane.demo", username: "anna", name: "Anna Petrova" },
    { email: "lea@luxlane.demo", username: "lea", name: "Lea Moreau" },
    { email: "nina@luxlane.demo", username: "nina", name: "Nina Okafor" },
    { email: "jade@luxlane.demo", username: "jade", name: "Jade Kim" },
  ],
  clients: [
    { email: "alexanderchen@luxlane.demo", username: "alexanderchen", name: "Alexander Chen" },
    { email: "stevenmeisel@luxlane.demo", username: "stevenmeisel", name: "Steven Meisel" },
    { email: "sarahwilson@luxlane.demo", username: "sarahwilson", name: "Sarah Wilson" },
    { email: "marcjacobs@luxlane.demo", username: "marcjacobs", name: "Marc Jacobs Studio" },
    { email: "indiarussell@luxlane.demo", username: "indiarussell", name: "India Russell" },
    { email: "colinjones@luxlane.demo", username: "colinjones", name: "Colin Jones" },
    { email: "emilythompson@luxlane.demo", username: "emilythompson", name: "Emily Thompson" },
    { email: "davidkim@luxlane.demo", username: "davidkim", name: "David Kim" },
    { email: "rachelmiller@luxlane.demo", username: "rachelmiller", name: "Rachel Miller" },
    { email: "jamesbrown@luxlane.demo", username: "jamesbrown", name: "James Brown" },
  ],
} as const

/** Example login (use in UI/docs): sofia@luxlane.demo / password123 */
export const EXAMPLE_LOGIN = {
  email: "sofia@luxlane.demo",
  password: TEST_PASSWORD,
} as const
