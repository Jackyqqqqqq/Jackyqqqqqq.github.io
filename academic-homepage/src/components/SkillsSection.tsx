import { siteContent } from "../content";
import type { Locale, SkillNode } from "../content.types";
import { pick } from "../i18n";

interface SkillsSectionProps {
  locale: Locale;
}

function SkillBranch({ node, locale }: { node: SkillNode; locale: Locale }) {
  const hasChildren = node.children && node.children.length > 0;
  return (
    <li className={hasChildren ? "skill-branch" : "skill-leaf"}>
      <span className="skill-node">{pick(node.name, locale)}</span>
      {hasChildren ? (
        <ul>
          {node.children!.map((child) => (
            <SkillBranch key={child.name.en} node={child} locale={locale} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function SkillsSection({ locale }: SkillsSectionProps) {
  return (
    <section className="content-section" id="skills">
      <h2>{pick(siteContent.navigation[4].label, locale)}</h2>
      <div className="skill-tree" role="tree" aria-label={pick(siteContent.skills.name, locale)}>
        <ul className="skill-tree-root">
          {siteContent.skills.children?.map((child) => (
            <SkillBranch key={child.name.en} node={child} locale={locale} />
          ))}
        </ul>
      </div>
    </section>
  );
}
