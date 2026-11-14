import type { Metadata } from "next";
import { formatDate, getSite } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Where the data comes from, how often it updates, and how paid status is worked out.",
};

export default function About() {
  const site = getSite();
  return (
    <article className="mx-auto max-w-[68ch] px-4 pb-20 pt-10 leading-relaxed sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">About this site</h1>
      <p className="mt-4 text-muted">
        LFX Orgs is an unofficial, student-made explorer for the Linux Foundation&apos;s LFX Mentorship program. The
        official site lists programs one by one. This site groups them by organization so you can see who comes back every
        year, what they built before, and what skills they want.
      </p>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Where the data comes from</h2>
      <p className="mt-3 text-muted">
        Everything is read from the public LFX Mentorship website (mentorship.linuxfoundation.org): programs, terms, skills,
        sponsors and selected mentees. A script fetches it every day, so a new term shows up here soon after LFX lists it.
        Last update: <time dateTime={site.fetchedAt}>{formatDate(site.fetchedAt)}</time>, covering{" "}
        {site.programCount.toLocaleString("en-US")} programs.
      </p>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">How &quot;paid&quot; is decided</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
        <li>
          <strong className="text-ink">Paid</strong>: the program lists a sponsor with money on LFX. The amount shown is the
          total sponsorship for that program, not what one mentee gets. The stipend you get depends on your country.
        </li>
        <li>
          <strong className="text-ink">Unpaid</strong>: no sponsor is listed, or the title itself says unpaid.
        </li>
        <li>Always open the program on LFX and check its Sponsors tab before you apply.</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">How programs are grouped</h2>
      <p className="mt-3 text-muted">
        Big foundations like CNCF and LF Decentralized Trust host many projects, so their programs are grouped by project
        name (from the title or the GitHub repo). Smaller foundations are shown as one organization. A few programs that
        can&apos;t be matched sit under &quot;other projects&quot;.
      </p>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Privacy</h2>
      <p className="mt-3 text-muted">
        For mentees we only show the name and term that LFX already shows publicly. No photos, intros or contact details
        are copied. If you want your name removed, open an issue on this site&apos;s repository.
      </p>

      <h2 className="mt-10 text-xl font-semibold tracking-tight">Not official</h2>
      <p className="mt-3 text-muted">
        This site is not affiliated with or endorsed by the Linux Foundation. LFX is their trademark. For applying, dates
        and rules, the official LFX Mentorship site is always the source of truth.
      </p>
    </article>
  );
}
