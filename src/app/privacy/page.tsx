import { LegalLayout } from "@/components/legal-layout";

export const metadata = {
  title: "Privacy Policy",
  description: "How Qyntra handles your data — connectors, retrieval, models, and your right to delete.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout kicker="Legal" title="Privacy Policy" updated="2026-05-19">
      <p>
        Qyntra is a personal knowledge tool. Everything we store on your behalf exists to make your own
        files searchable inside your own account. We do not sell user data, ever.
      </p>

      <h2>1. What we store</h2>
      <ul>
        <li>
          <strong>Profile</strong> — email, display name, avatar URL, provider (Google / GitHub / Notion / magic link),
          plus a hashed password if you signed up with email.
        </li>
        <li>
          <strong>Connector tokens</strong> — encrypted OAuth access and refresh tokens for the providers you connect
          (Google Drive, Gmail, Notion, GitHub). These are stored in our database with row-level security and used
          only for the syncs you trigger or your scheduled re-sync.
        </li>
        <li>
          <strong>Ingested content</strong> — the file metadata and extracted text we pull from those providers when
          you sync. We never copy what you didn&apos;t ask us to ingest.
        </li>
        <li>
          <strong>Chat history</strong> — the messages you send to Qyntra Chat and the assistant responses, so you can
          re-open conversations later.
        </li>
      </ul>

      <h2>2. What we do NOT store</h2>
      <ul>
        <li>We do not store provider passwords. OAuth means we never see them.</li>
        <li>We do not store credit-card numbers. Payments (when available) go through Stripe.</li>
        <li>We do not train any model on your content.</li>
        <li>We do not share ingested content with third parties, except the model providers below for the duration of a single request.</li>
      </ul>

      <h2>3. Model providers</h2>
      <p>
        When you ask a question, the relevant snippets from your wiki plus your message are sent to
        <strong> Groq</strong> (Llama 3.3 70B Versatile and Llama 3.2 Vision for OCR) over an encrypted TLS connection.
        Groq does not retain prompts for training. If you supply your own API key on the Chat page, we route directly
        to the provider with that key and the request bypasses our server-side billing.
      </p>

      <h2>4. Cookies + local storage</h2>
      <p>
        We use one HTTP-only session cookie for authentication. We also use your browser&apos;s
        <code> localStorage</code> to remember things like demo mode, chat history, your preferred BYO API key, and
        whether you&apos;ve dismissed the install prompt. These never leave your device.
      </p>

      <h2>5. Telemetry + error reporting</h2>
      <p>
        Client errors are captured by our own <code>/api/track</code> endpoint to help debug crashes. If a Sentry DSN
        is configured we may also forward stack traces to Sentry. Reports include URL, browser metadata, the error
        message and stack — never your wiki content or chat messages.
      </p>

      <h2>6. Deletion</h2>
      <p>
        You can disconnect any source from <a href="/sources">Sources</a> at any time, which deletes the stored tokens
        and any associated rows. To delete your entire account and all data, email
        <a href="mailto:hello@qyntra.app"> hello@qyntra.app</a> from your account email and we will purge within 7 days.
      </p>

      <h2>7. Children</h2>
      <p>Qyntra is not directed at users under 13 and we do not knowingly collect data from them.</p>

      <h2>8. Changes</h2>
      <p>
        We will post any material changes here and update the &quot;Last updated&quot; date at the top. Continued use
        of Qyntra after a change constitutes acceptance.
      </p>
    </LegalLayout>
  );
}
