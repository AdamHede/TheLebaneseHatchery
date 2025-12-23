/**
 * Ending Screen
 * 
 * Shows the run outcome and options to continue
 */

import { useGame } from '../../app/GameProvider';
import { getTotalDelegates } from '../../engine/state';
import styles from './EndingScreen.module.css';

const ENDINGS = {
    capture: {
        title: 'CAPTURED',
        subtitle: 'Victory Through Delegation',
        description: 'Your federation bloc has secured control of the labor council. The workers are now represented—officially. Whether they are heard is another matter entirely.',
        flavor: '"We have achieved unprecedented stakeholder alignment. Meeting adjourned."',
        color: '#4ade80',
    },
    collapse: {
        title: 'COLLAPSED',
        subtitle: 'The Hatchery Falls',
        description: 'Your house of cards has toppled. Whether through scandal, audit, or street pressure, the hatchery operation has been exposed and dismantled.',
        flavor: '"The irregularities were... extensive. Further investigation is ongoing."',
        color: '#f87171',
    },
    whistleblower: {
        title: 'EXPOSED',
        subtitle: 'The Truth Emerges',
        description: 'You chose transparency. The full scope of federation manipulation has been documented and released. Reform becomes possible.',
        flavor: '"Sometimes the system must be revealed before it can be changed."',
        color: '#60a5fa',
    },
};

export function EndingScreen() {
    const { state, resetGame } = useGame();

    const ending = state.ending || 'collapse';
    const endingData = ENDINGS[ending];
    const totalDelegates = getTotalDelegates(state);
    const federationCount = Object.keys(state.federations).length;
    const cyclesCompleted = state.cycle;

    return (
        <div className={styles.container} style={{ '--accent-color': endingData.color } as React.CSSProperties}>
            <div className={styles.content}>
                <h1 className={styles.title}>{endingData.title}</h1>
                <h2 className={styles.subtitle}>{endingData.subtitle}</h2>

                <p className={styles.description}>{endingData.description}</p>

                <blockquote className={styles.flavor}>
                    {endingData.flavor}
                </blockquote>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{cyclesCompleted}</span>
                        <span className={styles.statLabel}>Cycles Completed</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{federationCount}</span>
                        <span className={styles.statLabel}>Federations Created</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{totalDelegates}</span>
                        <span className={styles.statLabel}>Final Delegates</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{state.unlockedFootnotes.length}</span>
                        <span className={styles.statLabel}>Footnotes Unlocked</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.primaryButton}
                        onClick={() => resetGame()}
                    >
                        Try Again
                    </button>
                    {state.unlockedFootnotes.length > 0 && (
                        <button className={styles.secondaryButton}>
                            View Museum ({state.unlockedFootnotes.length})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
