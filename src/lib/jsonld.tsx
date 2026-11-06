import { links, profile, seo } from "@/content/content";
import { headshot } from "@/content/extras";
import { getProject, type ProjectSlug } from "./projects";
import { SITE_URL } from "./site";

/**
 * schema.org structured data (Person, WebSite, ProfilePage, project pages).
 * Helps search engines tie the site, GitHub and LinkedIn to one person.
 * Deliberately leaves out birth date, phone, graduation year and email.
 */

const PERSON_ID = `${SITE_URL}/#person`;

const sameAs = [links.github, links.linkedin, links.twitter]
  .filter((l) => l.enabled !== false)
  .map((l) => l.href);

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: profile.name,
        url: SITE_URL,
        image: `${SITE_URL}${headshot.src}`,
        jobTitle: profile.role,
        description: seo.description,
        homeLocation: { "@type": "Place", name: profile.location },
        affiliation: {
          "@type": "CollegeOrUniversity",
          name: profile.education.school,
        },
        knowsLanguage: profile.spokenLanguages,
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: profile.name,
        publisher: { "@id": PERSON_ID },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: seo.title,
        mainEntity: { "@id": PERSON_ID },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
    ],
  };
}

export function projectJsonLd(slug: ProjectSlug) {
  const p = getProject(slug);
  const url = `${SITE_URL}/projects/${slug}`;
  const author = { "@type": "Person", "@id": PERSON_ID, name: profile.name };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        "@id": `${url}#project`,
        name: p.name,
        headline: p.tagline,
        description: p.description,
        url,
        image: `${url}/opengraph-image`,
        author,
        creator: author,
        programmingLanguage: p.stack.slice(0, 6),
        ...(p.links.code ? { codeRepository: p.links.code } : {}),
        ...(p.links.live ? { sameAs: [p.links.live] } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Projects",
            item: `${SITE_URL}/#projects`,
          },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
    ],
  };
}

/** Inline JSON-LD. `<` is escaped so the payload can never close the tag. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
