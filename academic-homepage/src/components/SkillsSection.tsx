import { siteContent } from "../content";
import type { Locale, SkillNode, SkillStatus } from "../content.types";
import { pick } from "../i18n";

interface SkillsSectionProps {
  locale: Locale;
}

interface Pt {
  x: number;
  y: number;
}

/* Trunk top is where the three main limbs fork. */
const TRUNK_TOP: Pt = { x: 500, y: 468 };

/* Quadratic control point + end point for each limb (left / centre / right). */
const LIMBS: Array<{ c: Pt; end: Pt }> = [
  { c: { x: 362, y: 416 }, end: { x: 208, y: 288 } },
  { c: { x: 506, y: 322 }, end: { x: 500, y: 170 } },
  { c: { x: 638, y: 416 }, end: { x: 792, y: 288 } }
];

const LEAF_OFFSET = 36;
const LABEL_OFFSET = 22;

function qPoint(t: number, p0: Pt, c: Pt, p1: Pt): Pt {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const d = t * t;
  return { x: a * p0.x + b * c.x + d * p1.x, y: a * p0.y + b * c.y + d * p1.y };
}

function qTangent(t: number, p0: Pt, c: Pt, p1: Pt): Pt {
  return {
    x: 2 * (1 - t) * (c.x - p0.x) + 2 * t * (p1.x - c.x),
    y: 2 * (1 - t) * (c.y - p0.y) + 2 * t * (p1.y - c.y)
  };
}

function unit(v: Pt): Pt {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function collectLeaves(node: SkillNode): SkillNode[] {
  if (!node.children || node.children.length === 0) return [node];
  return node.children.flatMap(collectLeaves);
}

export default function SkillsSection({ locale }: SkillsSectionProps) {
  const branches = siteContent.skills.children ?? [];

  return (
    <section className="content-section" id="skills">
      <h2>{pick(siteContent.navigation[4].label, locale)}</h2>
      <div className="skill-tree-wrap">
        <svg
          className="skill-tree-svg"
          viewBox="0 0 1000 660"
          role="img"
          aria-label={pick(siteContent.skills.name, locale)}
        >
          {/* ground */}
          <line className="tree-ground" x1="320" y1="642" x2="680" y2="642" />
          {/* trunk */}
          <path
            className="tree-trunk"
            d="M500 642 C495 604 505 566 500 528 C496 504 499 484 500 468"
          />
          {branches.map((branch, branchIndex) => {
            const limb = LIMBS[branchIndex % LIMBS.length];
            const leaves = collectLeaves(branch);
            const labelDir = unit({ x: limb.end.x - limb.c.x, y: limb.end.y - limb.c.y });
            const labelAt = {
              x: limb.end.x + labelDir.x * 30,
              y: limb.end.y + labelDir.y * 30
            };
            return (
              <g key={branch.name.en}>
                <path
                  className="tree-limb"
                  d={`M${TRUNK_TOP.x} ${TRUNK_TOP.y} Q${limb.c.x} ${limb.c.y} ${limb.end.x} ${limb.end.y}`}
                />
                <text className="tree-branch-label" x={labelAt.x} y={labelAt.y + 6} textAnchor="middle">
                  {pick(branch.name, locale)}
                </text>
                {leaves.map((leaf, leafIndex) => {
                  const t =
                    leaves.length === 1 ? 0.58 : 0.3 + (0.62 * leafIndex) / (leaves.length - 1);
                  const onLimb = qPoint(t, TRUNK_TOP, limb.c, limb.end);
                  const normal = unit(qTangent(t, TRUNK_TOP, limb.c, limb.end));
                  const side = leafIndex % 2 === 0 ? 1 : -1;
                  const nx = -normal.y * side;
                  const ny = normal.x * side;
                  const leafAt = { x: onLimb.x + nx * LEAF_OFFSET, y: onLimb.y + ny * LEAF_OFFSET };
                  const labelX = leafAt.x + nx * LABEL_OFFSET;
                  const labelY = leafAt.y + ny * LABEL_OFFSET;
                  const anchor = nx > 0.2 ? "start" : nx < -0.2 ? "end" : "middle";
                  const status: SkillStatus = leaf.status ?? "owned";
                  return (
                    <g key={leaf.name.en} className={`tree-leaf is-${status}`}>
                      <line className="tree-twig" x1={onLimb.x} y1={onLimb.y} x2={leafAt.x} y2={leafAt.y} />
                      {status === "learning" ? (
                        <circle className="tree-leaf-ring" cx={leafAt.x} cy={leafAt.y} r="14" />
                      ) : null}
                      <circle className="tree-leaf-dot" cx={leafAt.x} cy={leafAt.y} r="8" />
                      <text className="tree-leaf-label" x={labelX} y={labelY + 5} textAnchor={anchor}>
                        {pick(leaf.name, locale)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="skill-legend">
        <li className="is-owned">
          <span className="skill-legend-dot" aria-hidden="true" />
          {pick(siteContent.ui.skillOwned, locale)}
        </li>
        <li className="is-learning">
          <span className="skill-legend-dot" aria-hidden="true" />
          {pick(siteContent.ui.skillLearning, locale)}
        </li>
        <li className="is-planned">
          <span className="skill-legend-dot" aria-hidden="true" />
          {pick(siteContent.ui.skillPlanned, locale)}
        </li>
      </ul>
    </section>
  );
}
