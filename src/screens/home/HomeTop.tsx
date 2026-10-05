import type { ReactNode } from 'react';
import type { CvPage } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from '../../shared/agentTarget';
import { HomeHeader } from './HomeHeader';
import { HomeMetaBar } from './HomeMetaBar';
import styles from './HomeTop.module.css';

interface HomeTopProps {
  /** Absent while the page loads: only the meta bar shows. */
  page?: CvPage;
  metaBarEnd?: ReactNode;
  highlightedId: AgentTargetId | null;
}

/** The top of the page, the agent's `header` section: the meta bar and the header under it. */
export function HomeTop({ page, metaBarEnd, highlightedId }: HomeTopProps) {
  return (
    <div
      className={styles.root}
      {...(page ? agentTargetProps('section', 'header', highlightedId) : {})}
    >
      <HomeMetaBar meta={page?.meta} end={metaBarEnd} />
      {page && <HomeHeader page={page} highlightedId={highlightedId} />}
    </div>
  );
}
