import { LegalLayout } from "@/components/legal-layout";

export const metadata = {
  title: "Terms of Service",
  description: "The fair, short rules of using Qyntra.",
};

export default function TermsPage() {
  return (
    <LegalLayout kicker="Legal" title="Terms of Service" updated="2026-05-19">
      <p>
        Use of Qyntra means you accept these terms. They are intentionally short.
      </p>

      <h2>1. The service</h2>
      <p>
        Qyntra is a personal knowledge OS that ingests content from your authorised sources and lets you search,
        chat with, and assemble wiki articles from that content. We provide it on a best-effort basis and do not
        guarantee uptime or accuracy. AI-generated answers can be wrong — always verify before relying on them.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You are responsible for keeping your authentication credentials safe.</li>
        <li>One human per account. No sharing logins for paid plans.</li>
        <li>You must be 13+ to use Qyntra.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>Do not connect content you do not have the right to ingest.</li>
        <li>Do not use Qyntra to harass, defraud, or break the law.</li>
        <li>Do not attempt to extract another user&apos;s data, reverse engineer security controls, or abuse the model APIs.</li>
        <li>Automated scraping or load testing without prior permission is not allowed.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You retain ownership of everything you ingest. You grant Qyntra a limited licence to process, store, embed
        and display that content solely to operate the service for you. We do not train models on your content.
      </p>

      <h2>5. Generated articles</h2>
      <p>
        Articles produced by the Generate feature are grounded on your evidence and cite their sources, but they are
        machine-generated and may contain errors. You are responsible for verifying claims before sharing or
        publishing.
      </p>

      <h2>6. Payment + plans</h2>
      <p>
        The free Hobby plan exists for solo personal use. Pro is billed monthly through Stripe; cancellations take
        effect at the end of the current billing period and we do not pro-rate refunds. See <a href="/pricing">Pricing</a>.
      </p>

      <h2>7. Termination</h2>
      <p>
        You can stop using Qyntra at any time. We may suspend accounts that violate these terms after a written
        notice where reasonably possible.
      </p>

      <h2>8. Disclaimer</h2>
      <p>
        Qyntra is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law,
        we are not liable for any indirect or consequential damages, including loss of data, revenue or goodwill.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of England and Wales. Disputes will be resolved in the courts of
        Liverpool, UK.
      </p>
    </LegalLayout>
  );
}
