import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back</Link>
        <h1 className="text-3xl font-bold mt-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: March 21, 2026</p>
        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email address, profile photos, physical measurements (for models), and portfolio content. We also collect usage data such as pages visited, features used, and device information.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Information</h2>
            <p>We use your information to: match models with casting opportunities, provide analytics and insights, facilitate communication between users, improve the platform, and send relevant notifications.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share your profile information only with parties you interact with on the platform (e.g., brands you apply to, agencies you join). We may share anonymized, aggregated data for analytics purposes.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Retention</h2>
            <p>Your data is retained while your account is active. You may request deletion of your account and associated data at any time. Upon deletion, your data will be removed within 30 days, except where retention is required by law.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights</h2>
            <p>You have the right to: access your personal data, correct inaccurate information, request deletion of your data, export your data in a portable format, and withdraw consent for data processing.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Security</h2>
            <p>We use industry-standard encryption for data in transit and at rest. Access to personal data is restricted to authorized personnel. We conduct regular security audits to protect your information.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Cookies</h2>
            <p>We use session cookies for authentication and essential platform functionality. We do not use third-party tracking cookies. You can manage cookie preferences in your browser settings.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
            <p>For privacy-related questions or data requests, contact us at privacy@luxlane.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
