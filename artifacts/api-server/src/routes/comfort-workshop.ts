import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request } from "express";

const router: IRouter = Router();
const COOKIE_NAME = "comfort_workshop_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

const PRIVATE_CONTENT = `
  <div class="private-detail-header">
    <p class="eyebrow">Comfort Workshop / private product walkthrough</p>
    <h2>One system from first enquiry to a chair in the living room.</h2>
    <p class="private-detail-lead">A vertical software system purpose-built for a mobility furniture maker: public marketing, lead handling, consultation, quoting, workshop production, delivery and aftercare in one connected product.</p>
  </div>

  <div class="private-detail-grid">
    <section class="private-detail-section private-detail-wide">
      <div class="private-detail-section-label">01 / Public website</div>
      <div>
        <h3>Win the right customers.</h3>
        <p>The public experience positions premium British-made riser recliners around the person, with free home consultation and white-glove delivery.</p>
        <ul>
          <li>Collections for traditional, contemporary, pressure-care and everyday support chairs</li>
          <li>Product, fabric, health-benefit and buyer-guide content</li>
          <li>SEO landing pages for high-intent searches</li>
          <li>Trust pages covering consultation, showroom, delivery, VAT relief and made in Britain</li>
          <li>Brochure requests, home-demo bookings, showroom appointments and live chat</li>
          <li>Large type, high contrast, click-to-call contact and accessible tap targets</li>
        </ul>
      </div>
    </section>

    <section class="private-detail-section">
      <div class="private-detail-section-label">02 / CRM</div>
      <div>
        <h3>Turn enquiries into useful conversations.</h3>
        <p>Every lead carries its source, consent, qualification, estimated value, next action and activity history through the sales pipeline.</p>
        <ul>
          <li>New enquiry through brochure, demo, quote, follow-up, won, delivered or lost</li>
          <li>Separate contact and chair-user records</li>
          <li>Qualification for needs, mobility, money, decision-maker and trade-in</li>
          <li>Automatic brochure tasks, follow-up reminders and appointment confirmations</li>
          <li>Live call screens with scripts, missing-information prompts, notes and outcomes</li>
          <li>Quote PDFs, formal letters and welcome or handover documents</li>
        </ul>
      </div>
    </section>

    <section class="private-detail-section">
      <div class="private-detail-section-label">03 / Consultation</div>
      <div>
        <h3>Quote on the visit.</h3>
        <p>The consultation tool supports a 60–90 minute home or showroom fitting without switching between forms, price sheets and separate documents.</p>
        <ul>
          <li>Needs, goals, chair user, room checks and body measurements</li>
          <li>Live configuration for range, size, back, arms, cushion, motor and fabric</li>
          <li>Accessories, delivery options, trade-in and second-chair pricing</li>
          <li>VAT relief toggle with eligibility explanation</li>
          <li>Fabric catalogues, quote comparison and customer signature</li>
          <li>Deposit capture, PDF quote pack and release to production</li>
          <li>Standalone configurator for instant pricing and stock specification</li>
        </ul>
      </div>
    </section>

    <section class="private-detail-section private-detail-wide private-detail-dark">
      <div class="private-detail-section-label">04 / Workshop, stock and after-sale</div>
      <div>
        <h3>Build and deliver without spreadsheets.</h3>
        <div class="private-detail-columns">
          <div>
            <p class="private-detail-subhead">Production</p>
            <ul>
              <li>Person-assigned board from frame and fabric through assembly, sewing and upholstery</li>
              <li>Promised dates, printable tickets, subtasks and undo</li>
              <li>Quality-control checklist with finished-chair photo</li>
              <li>Shared sewing manual with notes and photos per part</li>
            </ul>
          </div>
          <div>
            <p class="private-detail-subhead">Stock and sold chairs</p>
            <ul>
              <li>Showroom and workshop stock with photos, specification and pricing</li>
              <li>Sell a stock chair to a lead and connect it to the quote or order</li>
              <li>Unique chair ID, promised versus actual delivery and payment ledger</li>
              <li>Stripe balance links, warranty status and welcome letter</li>
            </ul>
          </div>
          <div>
            <p class="private-detail-subhead">Customer completion</p>
            <ul>
              <li>VAT relief signing and staff countersignature</li>
              <li>Delivery confirmation with customer signature, photo and notes</li>
              <li>Stored documents for later reference and aftercare</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="private-detail-section private-detail-wide">
      <div class="private-detail-section-label">05 / Roles and KPIs</div>
      <div>
        <h3>The right view for every person.</h3>
        <p>Role-based access keeps the product useful on the shop floor as well as in the office. Admin, consultant, operations and workshop users each get the tools and visibility their work requires.</p>
        <div class="private-detail-kpis">
          <div><strong>Executive</strong><span>Business health</span></div>
          <div><strong>Marketing</strong><span>Source, consent and campaign performance</span></div>
          <div><strong>Pipeline</strong><span>Conversion and lost reasons</span></div>
          <div><strong>Operations</strong><span>Production and delivery performance</span></div>
        </div>
      </div>
    </section>

    <section class="private-detail-section private-detail-wide private-detail-security">
      <div class="private-detail-section-label">06 / Security</div>
      <div>
        <h3>Operational detail, kept in the right hands.</h3>
        <p>Staff login, lockout after failed attempts, forced password changes, invalidated sessions, an audit log, CSRF protection and rate limits keep the internal product separate from the public marketing experience.</p>
        <div class="private-detail-journey"><span>Google</span><b>→</b><span>Enquiry</span><b>→</b><span>Consultation</span><b>→</b><span>Signed chair</span><b>→</b><span>Workshop</span><b>→</b><span>Delivery</span></div>
      </div>
    </section>
  </div>
`;

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  const length = Math.max(leftBuffer.length, rightBuffer.length);
  const paddedLeft = Buffer.alloc(length);
  const paddedRight = Buffer.alloc(length);
  leftBuffer.copy(paddedLeft);
  rightBuffer.copy(paddedRight);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(paddedLeft, paddedRight);
}

function sessionSignature(payload: string): string | null {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(): string | null {
  const payload = `${Math.floor(Date.now() / 1000)}`;
  const signature = sessionSignature(payload);
  return signature ? `${payload}.${signature}` : null;
}

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  const match = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function hasValidSession(req: Request): boolean {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature || !/^\d+$/.test(issuedAt)) return false;
  const issuedSeconds = Number(issuedAt);
  const age = Math.floor(Date.now() / 1000) - issuedSeconds;
  const expectedSignature = sessionSignature(issuedAt);
  return Boolean(expectedSignature && age >= 0 && age <= SESSION_MAX_AGE_SECONDS && constantTimeEqual(signature, expectedSignature));
}

function getClientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function allowAttempt(key: string): boolean {
  const now = Date.now();
  const current = failedAttempts.get(key);
  if (!current || current.resetAt <= now) {
    failedAttempts.set(key, { count: 0, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  return current.count < 8;
}

function recordFailedAttempt(key: string): void {
  const current = failedAttempts.get(key);
  if (current) current.count += 1;
}

router.post("/comfort-workshop/auth", (req, res) => {
  const password = process.env["COMFORT_WORKSHOP_DETAIL_PASSWORD"];
  const clientKey = getClientKey(req);
  if (!allowAttempt(clientKey)) {
    return res.status(429).json({ error: "Too many attempts. Please try again later." });
  }
  if (!password || !process.env["SESSION_SECRET"]) {
    return res.status(503).json({ error: "Private access is not configured." });
  }
  const suppliedPassword = typeof req.body?.password === "string" ? req.body.password : "";
  if (!constantTimeEqual(suppliedPassword, password)) {
    recordFailedAttempt(clientKey);
    return res.status(401).json({ error: "That password was not recognised." });
  }
  const token = createSessionToken();
  if (!token) return res.status(503).json({ error: "Private access is not configured." });
  const secureFlag = process.env["NODE_ENV"] === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`);
  failedAttempts.delete(clientKey);
  return res.json({ authenticated: true });
});

router.get("/comfort-workshop/session", (req, res) => {
  return res.json({ authenticated: hasValidSession(req) });
});

router.get("/comfort-workshop/content", (req, res) => {
  if (!hasValidSession(req)) return res.status(401).json({ error: "Authentication required." });
  res.setHeader("Cache-Control", "no-store");
  return res.json({ html: PRIVATE_CONTENT });
});

router.post("/comfort-workshop/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
  return res.json({ authenticated: false });
});

export default router;