import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">&larr; Back</Link>
        <h1 className="text-3xl font-bold mt-6">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: March 21, 2026</p>
        <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Luxlane (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Eligibility</h2>
            <p>You must be at least 16 years old to use Luxlane. Users under 18 must have parental or guardian consent. By creating an account, you represent that you meet these requirements.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Account Types</h2>
            <p>Luxlane offers four account types: Model, Brand, Agency, and Client. You are responsible for maintaining the confidentiality of your login credentials and all activity under your account.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. User Conduct</h2>
            <p>You agree not to: post false or misleading information, harass other users, infringe on intellectual property rights, use the platform for illegal activities, or attempt to circumvent security measures.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Content Ownership</h2>
            <p>You retain ownership of content you post. By uploading content, you grant Luxlane a non-exclusive, worldwide license to display, distribute, and promote your content on the Platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Castings &amp; Bookings</h2>
            <p>Luxlane facilitates connections between brands and models. We are not a party to any agreements between users. Payment terms, contracts, and working conditions are between the hiring party and the talent.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
            <p>Luxlane is provided &ldquo;as is&rdquo; without warranties. We are not liable for any disputes between users, lost earnings, or damages arising from platform use.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
            <p>For questions about these terms, contact us at legal@luxlane.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
