# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅ Yes    |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Email: venkataraman.tb@mythics.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within 48 hours.

## Security Measures

- JWT authentication on all admin endpoints
- CORS restricted to known frontend origins
- All secrets managed via environment variables (never committed)
- Dependabot enabled for automated dependency updates
- CodeQL scanning on every push and weekly
- `bandit` static analysis on Python code in CI
- Neon DB uses SSL-only connections (`sslmode=require`)
- Admin panel protected by bcrypt-hashed password
