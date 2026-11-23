/** Who the site is about. Every page, feed and agent endpoint reads from here. */
export const profile = {
  name: "Caden Sumner",
  role: "Product engineer",
  location: "Denver, Colorado",
  timeZone: "America/Denver",
  url: "https://cadensumner.com",
  summary:
    "Eight years at WeMod, Dashlane and Visa. I also run Jackalope Digital, where I build tools for coding agents.",
  statement:
    "I build software people use. Eight years on signup, onboarding and growth. The last year on tools for coding agents.",
  education: "B.S. Computer Science and Psychology, Michigan Technological University",
  links: [
    { label: "Email", url: "mailto:cadenjsumner@gmail.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/cadensumner" },
    { label: "GitHub", url: "https://github.com/Ghosts" },
    { label: "X", url: "https://x.com/cadensumner" },
  ],
} as const;
