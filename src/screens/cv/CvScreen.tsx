import type { ReactNode } from 'react';
import { commonStrings, useStrings } from '../../i18n';
import { FooterCta } from '../../shared/forest/FooterCta';
import { ForestPage } from '../../shared/forest/ForestPage';
import { PageStatus } from '../../shared/forest/PageStatus';
import { Section } from '../../shared/forest/Section';
import { SkillsGrid } from '../../shared/forest/SkillsGrid';
import { agentTargetProps } from '../../shared/agentTarget';
import { CvCards } from './CvCards';
import { CvExperience } from './CvExperience';
import { CvHeader } from './CvHeader';
import type { CvUiState } from './CvUiState';
import { contactHref } from './contactLinks';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface CvScreenProps {
  className?: string;
  state: CvUiState;
  /** Controls at the right end of the meta bar (the language switcher). */
  metaBarEnd?: ReactNode;
}

/** The CV page in the Forest look (SPEC → Mapping `/`), sections numbered top to bottom. */
export function CvScreen({ className, state, metaBarEnd }: CvScreenProps) {
  const common = useStrings(commonStrings);
  const strings = useStrings(cvStrings);

  if (state.status !== 'ready') {
    return (
      <ForestPage className={className} testId={cvTestIds.root}>
        <CvHeader metaBarEnd={metaBarEnd} />
        <PageStatus
          text={state.status === 'loading' ? common.loading : common.loadError}
          testId={cvTestIds.status}
        />
      </ForestPage>
    );
  }

  const { cv, highlightedId } = state;
  return (
    <ForestPage className={className} testId={cvTestIds.root}>
      <CvHeader cv={cv} highlightedId={highlightedId} metaBarEnd={metaBarEnd} />
      <Section
        index={1}
        title={strings.skillsTitle}
        variant="rows"
        testId={cvTestIds.skills}
        attributes={agentTargetProps('section', 'technologies', highlightedId)}
      >
        <SkillsGrid
          groups={cv.technologies.map((card) => ({
            id: card.id,
            title: card.title,
            items: card.items.join(', '),
            emphasis: SKILL_EMPHASIS[card.variant],
            attributes: agentTargetProps('technology', card.id, highlightedId),
          }))}
        />
      </Section>
      <CvExperience index={2} cv={cv} highlightedId={highlightedId} />
      <CvCards index={3} cv={cv} highlightedId={highlightedId} />
      <FooterCta
        label={strings.footerCta}
        href={contactHref(cv.header.contacts, 'email')}
        note={`${strings.copyright} ${cv.header.name}`}
      />
    </ForestPage>
  );
}

/** How a technology card's variant shows in the skills grid. */
const SKILL_EMPHASIS = {
  default: undefined,
  highlighted: 'accent',
  ai: 'gradient',
} as const;
