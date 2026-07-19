# depup.io AWS migration — verified state (2026-07-18)

## Headline
The Cloudflare → AWS migration this was asked to *stage* is **already done and live**.
depup.io is delegated to AWS Route53 at the `.io` registry level — the "irreversible
nameserver cutover reserved as Mikl's go/no-go" has already happened (infra timestamps
point to 2026-06-09). Nothing was staged/changed in this session; investigation only.

## Verified facts (evidence)
- **Registry delegation:** `dig NS depup.io @a0.nic.io` → AWS nameservers
  (ns-175.awsdns-21.com, ns-1902.awsdns-45.co.uk, ns-749.awsdns-29.net, ns-1531.awsdns-63.org).
  Public resolvers (1.1.1.1, 8.8.8.8) agree. Domain is authoritative on Route53, not Cloudflare.
- **Route53 hosted zone:** exists (Z02769041KA9T7KX4RU8I), 9 records.
- **SES email receiving — fully configured & verified live:**
  - Domain verification: Success. DKIM: Success (3 CNAME tokens, all resolve publicly).
  - MX `10 inbound-smtp.us-east-1.amazonaws.com`, SPF `v=spf1 include:amazonses.com ~all`,
    `_amazonses` TXT token — all resolve via public resolver.
  - Active receipt rule `forward-depup-mail` (in the active `clipharvest-inbound` rule set):
    recipient `depup.io` → S3 `depup-io-ses-inbound/inbox/` + Lambda `depup-mail-forwarder`.
  - Lambda `depup-mail-forwarder` (python3.12): FORWARD_TO `devdepup@gmail.com`,
    FORWARD_FROM `noreply@depup.io`. Mail to any @depup.io address is captured and forwarded.
- **Website: NOT configured (only real gap).** No A/AAAA/CNAME at apex or www. No CloudFront
  distribution, no S3 website bucket. `curl https://depup.io` → cannot resolve (no A record).
  Repo has no CNAME file; `homepage` in package.json points to a GitHub URL, so depup.io
  likely never served a hosted site — not an obvious regression.

## Housekeeping (non-blocking)
- Duplicate inactive SES rule set `depup-inbound` mirrors the active depup rule — redundant.
- Leftover `cf2024-1._domainkey.depup.io` TXT is a Cloudflare Email Routing DKIM key — safe to drop.

## Open decision (only one)
Should depup.io serve a website/redirect, and to where (GitHub redirect, S3+CloudFront, or leave
DNS-only for email)? Everything else — zone, delegation, email — is complete and live.

## Note
The referenced plan `docs/plans/2026-06-07-aws-domain-consolidation.md` does not exist in the repo
(could not locate on disk). This doc supersedes it as the current source of truth for depup.io DNS.
