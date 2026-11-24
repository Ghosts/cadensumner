import { publications, roles } from "@/content/experience";
import { profile } from "@/content/profile";
import { projects } from "@/content/work";

const webLinks = profile.links.filter((link) => link.url.startsWith("https://"));
const email = profile.links.find((link) => link.url.startsWith("mailto:"))?.url.slice(7);

/** schema.org ProfilePage, so search engines can attach the site to the person. */
export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: profile.url,
    mainEntity: {
      "@type": "Person",
      "@id": `${profile.url}/#person`,
      name: profile.name,
      jobTitle: profile.role,
      description: profile.summary,
      url: profile.url,
      address: { "@type": "PostalAddress", addressLocality: "Denver", addressRegion: "CO" },
      sameAs: webLinks.map((link) => link.url),
      worksFor: roles
        .filter((role) => !role.end)
        .map((role) => ({ "@type": "Organization", name: role.company })),
      alumniOf: { "@type": "CollegeOrUniversity", name: "Michigan Technological University" },
    },
  };
}

/** The resume in JSON Resume format (https://jsonresume.org/schema). */
export function jsonResume() {
  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: profile.name,
      label: profile.role,
      email,
      url: profile.url,
      summary: profile.summary,
      location: { city: "Denver", region: "Colorado", countryCode: "US" },
      profiles: webLinks.map((link) => ({ network: link.label, url: link.url })),
    },
    work: roles.map((role) => ({
      name: role.company,
      position: role.title,
      startDate: role.start,
      ...(role.end ? { endDate: role.end } : {}),
      summary: role.summary,
      highlights: role.highlights,
    })),
    skills: profile.skills.map((group) => ({ name: group.area, keywords: group.items })),
    education: [
      {
        institution: "Michigan Technological University",
        studyType: "B.S.",
        area: "Computer Science and Psychology",
      },
    ],
    publications: publications
      .filter((publication) => publication.kind !== "press")
      .map((publication) => ({
        name: publication.title,
        publisher: publication.venue,
        releaseDate: String(publication.year),
        url: publication.url,
        summary: publication.summary,
      })),
    projects: projects.map((project) => ({
      name: project.name,
      url: project.url,
      description: project.summary,
      keywords: project.tags,
    })),
  };
}
