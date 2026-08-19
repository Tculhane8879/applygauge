# Local Supabase Authentication Development

ApplyGauge v1 uses local Supabase for email/password Auth, confirmation-email capture, ES256 token
issuance, and JWKS discovery. ApplyGauge business logic and persistence remain behind FastAPI and
the separate application PostgreSQL instance on port 5432.

## Local service map

| Capability | Local address |
| --- | --- |
| Supabase API/Auth gateway | `http://127.0.0.1:55021` |
| JWT issuer | `http://127.0.0.1:55021/auth/v1` |
| JWKS | `http://127.0.0.1:55021/auth/v1/.well-known/jwks.json` |
| Supabase Auth-owned PostgreSQL | `localhost:54532` |
| Email-capture web UI | `http://127.0.0.1:55124` |
| Email-capture SMTP | `localhost:55125` |
| Email-capture POP3 | `localhost:55126` |

Supabase Analytics and Studio are intentionally disabled. Neither is needed for Auth development,
so omitting them keeps the stack focused on capabilities ApplyGauge uses.

## Signing-key initialization

The ignored `supabase/signing_keys.json` contains private local signing material and must never be
committed. Supabase CLI 2.114.0 requires it to exist as an empty JSON array before appending the
first key. This is a CLI compatibility step, not an architectural requirement.

PowerShell:

```powershell
Set-Content -Path supabase/signing_keys.json -Value '[]' -NoNewline
npx --no-install supabase gen signing-key --algorithm ES256 --workdir . --yes
```

macOS/Linux:

```bash
printf '[]' > supabase/signing_keys.json
npx --no-install supabase gen signing-key --algorithm ES256 --workdir . --yes
```

Verify the file is ignored, then start the stack:

```bash
git check-ignore supabase/signing_keys.json
npx --no-install supabase start --workdir .
```

Never print or copy the generated private JWK into logs or committed environment files.

## Windows port compatibility

Windows reserves the TCP range containing Supabase defaults 54321–54326 on the environment used to
establish Milestone 1. The checked-in local configuration uses database port `54532`, API/Auth port
`55021`, and email-capture ports `55124–55126`. These are local compatibility choices, not deployed
architecture requirements.

Signup uses the token-hash template in `supabase/templates/confirmation.html`. The allow-listed
`http://localhost:3000/auth/confirm` handler calls `verifyOtp`, stores the SSR session in cookies,
and redirects to the protected dashboard. Confirmed tokens use ES256, issuer
`http://127.0.0.1:55021/auth/v1`, and audience `authenticated`.
