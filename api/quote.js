// Handles submissions from the "Get a quote" form on the marketing site.
// Sends the enquiry to support@kainex.co.za via Resend.
//
// Requires the RESEND_API_KEY environment variable to be set on this
// Vercel project (Project Settings -> Environment Variables). It is a
// separate Vercel project from the main app, so the key must be added
// here too even if it already exists on the app project.

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'KAINEX Website <noreply@kainex.co.za>'
const TO_ADDRESS = process.env.QUOTE_TO_ADDRESS || 'support@kainex.co.za'
const FALLBACK_MESSAGE = 'Unable to send your request right now. Please email support@kainex.co.za or WhatsApp us on 081 426 8987 directly.'

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  body = body || {}

  const name = (body.name || '').toString().trim()
  const businessName = (body.businessName || '').toString().trim()
  const phone = (body.phone || '').toString().trim()
  const email = (body.email || '').toString().trim()
  const turnover = (body.turnover || '').toString().trim()
  const packageName = (body.package || '').toString().trim()
  // Honeypot field — real users never fill this in.
  const website = (body.website || '').toString().trim()

  if (website) {
    // Silently accept to not tip off bots, but skip sending.
    res.status(200).json({ ok: true })
    return
  }

  if (!name || !phone || !isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide your name, a valid email address, and a phone number.' })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured for kainex-site')
    res.status(500).json({ error: FALLBACK_MESSAGE })
    return
  }

  const subject = packageName
    ? `KAINEX quote request — ${packageName}`
    : 'KAINEX quote request'

  const textLines = [
    `Name: ${name}`,
    `Business: ${businessName || 'Not provided'}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Estimated annual turnover: ${turnover || 'Not provided'}`,
    `Package of interest: ${packageName || 'Not specified'}`,
  ]

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        reply_to: email,
        subject,
        text: textLines.join('\n'),
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Resend error', response.status, errText)
      res.status(502).json({ error: FALLBACK_MESSAGE })
      return
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Quote form submission error', err)
    res.status(500).json({ error: FALLBACK_MESSAGE })
  }
}
