/* --- put these near WhatsAppSVG --- */

export const InstagramSVG = (
  <svg
    aria-hidden
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="block"
  >
    <defs>
      <linearGradient id="igGradDev" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#F58529" />
        <stop offset="50%" stopColor="#DD2A7B" />
        <stop offset="100%" stopColor="#8134AF" />
      </linearGradient>
    </defs>

    {/* background */}
    <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#igGradDev)" />

    {/* camera / lens (white) */}
    <path
      d="M12 8.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zM17 7.2h-1.2a1 1 0 01-.8-.4l-.4-.6a2 2 0 00-1.6-.8H10a2 2 0 00-1.6.8l-.4.6a1 1 0 01-.8.4H6a2.8 2.8 0 00-2.8 2.8v3.6A2.8 2.8 0 006 16.4h12a2.8 2.8 0 002.8-2.8v-3.6A2.8 2.8 0 0017 7.2z"
      fill="#fff"
    />
    {/* small top-right dot */}
    <circle cx="17.3" cy="6.7" r="0.9" fill="#fff" />
  </svg>
)

export const FacebookSVG = (
  <svg
    aria-hidden
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="block"
  >
    {/* background circle */}
    <circle cx="12" cy="12" r="12" fill="#1877F2" />

    {/* stylized "f" in white */}
    <path
      d="M15.2 7.5h-1.2c-.3 0-.7.2-.7.6v1.1h1.9l-.2 1.6h-1.7v5.1h-1.8v-5.1H9.9v-1.6h1.7V9c0-1.4.9-2.9 2.6-2.9h1z"
      fill="#fff"
    />
  </svg>
)

export const MailSVG = (
  <svg
    aria-hidden
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="block"
  >
    {/* background rounded rect (gmail-like red) */}
    <rect x="0" y="0" width="24" height="24" rx="4" fill="#EA4335" />

    {/* envelope shape (white) */}
    <path
      d="M4 7.5v9a1 1 0 001 1h14a1 1 0 001-1v-9a1 1 0 00-1-1H5a1 1 0 00-1 1zm1 .7L12 12.7l7-4.5V7.5L12 11 5 7.5v.7z"
      fill="#fff"
    />
  </svg>
)

export const WhatsAppSVG = (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="block"
    >
      <path
        d="M20.52 3.48A11.86 11.86 0 0012 0C5.37 0 .06 5.31.06 11.93 0 14.18.55 16.32 1.6 18.18L0 24l6.04-1.58A11.9 11.9 0 0012 23.86c6.63 0 11.94-5.31 11.94-11.93 0-3.19-1.21-6.19-3.42-8.45z"
        fill="#25D366"
      />
      <path
        d="M17.06 14.38c-.29-.14-1.71-.84-1.98-.93-.27-.09-.47-.14-.67.14s-.77.93-.95 1.12c-.18.19-.36.21-.66.07-.3-.14-1.27-.47-2.41-1.48-.89-.79-1.49-1.77-1.67-2.07-.18-.3-.02-.46.13-.6.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2 0-.38-.01-.53-.02-.14-.67-1.6-.92-2.2-.24-.57-.49-.49-.67-.5-.17-.01-.36-.01-.55-.01s-.51.07-.78.36c-.27.29-1.04 1.02-1.04 2.48 0 1.45 1.06 2.86 1.21 3.06.15.2 2.08 3.35 5.03 4.7 2.95 1.35 2.95.9 3.48.85.53-.05 1.71-.7 1.95-1.38.24-.69.24-1.28.17-1.39-.07-.11-.27-.17-.57-.31z"
        fill="#fff"
      />
    </svg>
  )