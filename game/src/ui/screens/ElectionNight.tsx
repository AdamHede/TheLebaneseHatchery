/**
 * Election Night Screen
 * 
 * Displays the election results with delegate reliability rolls.
 * Delegates are rolled based on member union loyalty.
 */

import { useState, useEffect } from 'react';
import { useGame } from '../../app/GameProvider';
import { getTotalDelegates, getFederationReliability } from '../../engine/state';
import { createRNG } from '../../engine/rng';
import styles from './ElectionNight.module.css';

const DELEGATE_THRESHOLD = 6;

type DelegateRoll = {
    federationId: string;
    federationName: string;
    expected: number;
    secured: number;
    rolls: boolean[];
};

export function ElectionNight() {
    const { state, resolveElection } = useGame();
    const [delegateRolls, setDelegateRolls] = useState<DelegateRoll[]>([]);
    const [hasRolled, setHasRolled] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);

    const federations = Object.values(state.federations);

    // Calculate expected delegates (before rolls)
    const expectedDelegates = getTotalDelegates(state);

    // Calculate secured delegates (after rolls)
    const securedDelegates = delegateRolls.reduce((sum, roll) => sum + roll.secured, 0);

    const willWin = hasRolled ? securedDelegates >= DELEGATE_THRESHOLD : expectedDelegates >= DELEGATE_THRESHOLD;

    // Roll delegates when component mounts
    useEffect(() => {
        if (hasRolled) return;

        const rng = createRNG(state.rngCursor + 999); // Offset to avoid collision with other rolls
        const rolls: DelegateRoll[] = [];

        for (const federation of federations) {
            if (federation.recognition !== 'recognized') continue;

            const reliability = getFederationReliability(federation, state.unions);
            const loyaltyPercent = (reliability / 2) * 100; // Convert back to percentage

            // Roll each of the 2 delegates independently
            const delegateRolls: boolean[] = [];
            let secured = 0;

            for (let i = 0; i < 2; i++) {
                const roll = rng.nextInt(1, 100);
                const success = roll <= loyaltyPercent;
                delegateRolls.push(success);
                if (success) secured++;
            }

            rolls.push({
                federationId: federation.id,
                federationName: federation.name,
                expected: 2,
                secured,
                rolls: delegateRolls,
            });
        }

        setDelegateRolls(rolls);
        setHasRolled(true);
    }, [federations, state.unions, state.rngCursor, hasRolled]);

    const handleReveal = () => {
        setIsRevealing(true);
        // Small delay for dramatic effect
        setTimeout(() => {
            resolveElection();
        }, 500);
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.title}>ELECTION NIGHT</h1>
                <p className={styles.subtitle}>The votes are being counted...</p>

                {/* Federation Results */}
                <div className={styles.federationResults}>
                    {delegateRolls.map(roll => (
                        <div key={roll.federationId} className={styles.federationRoll}>
                            <span className={styles.fedName}>{roll.federationName}</span>
                            <div className={styles.delegateRolls}>
                                {roll.rolls.map((success, i) => (
                                    <span
                                        key={i}
                                        className={`${styles.delegateIcon} ${success ? styles.secured : styles.lost}`}
                                        title={success ? "Delegate secured!" : "Delegate defected!"}
                                    >
                                        {success ? '🗳️' : '❌'}
                                    </span>
                                ))}
                            </div>
                            <span className={styles.rollResult}>
                                {roll.secured}/{roll.expected}
                            </span>
                        </div>
                    ))}
                </div>

                <div className={styles.results}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{federations.length}</span>
                        <span className={styles.statLabel}>Federations</span>
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Expected</span>
                        <span className={styles.statValue}>{expectedDelegates}</span>
                    </div>

                    <div className={`${styles.statCard} ${styles.securedCard}`}>
                        <span className={styles.statLabel}>Secured</span>
                        <span className={`${styles.statValue} ${securedDelegates >= DELEGATE_THRESHOLD ? styles.winning : styles.losing}`}>
                            {securedDelegates}
                        </span>
                    </div>

                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{DELEGATE_THRESHOLD}</span>
                        <span className={styles.statLabel}>Required</span>
                    </div>
                </div>

                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        {/* Expected (faded) */}
                        <div
                            className={styles.progressExpected}
                            style={{ width: `${Math.min(100, (expectedDelegates / DELEGATE_THRESHOLD) * 100)}%` }}
                        />
                        {/* Secured (solid) */}
                        <div
                            className={`${styles.progressFill} ${willWin ? styles.winning : styles.losing}`}
                            style={{ width: `${Math.min(100, (securedDelegates / DELEGATE_THRESHOLD) * 100)}%` }}
                        />
                        <div
                            className={styles.threshold}
                            style={{ left: '100%' }}
                        />
                    </div>
                    <div className={styles.progressLabels}>
                        <span>0</span>
                        <span className={willWin ? styles.winning : styles.losing}>
                            {willWin ? 'MAJORITY SECURED' : 'BELOW THRESHOLD'}
                        </span>
                        <span>{DELEGATE_THRESHOLD}</span>
                    </div>
                </div>

                {expectedDelegates !== securedDelegates && (
                    <p className={styles.reliabilityNote}>
                        {securedDelegates < expectedDelegates
                            ? `⚠️ ${expectedDelegates - securedDelegates} delegate(s) defected! Your unions weren't loyal enough.`
                            : `All delegates held firm!`
                        }
                    </p>
                )}

                <p className={styles.prediction}>
                    {willWin
                        ? "Your federation bloc controls the labor council. The workers will be... represented."
                        : "Your delegate count falls short. The opposition claims victory. Your hatchery faces scrutiny."
                    }
                </p>

                <button
                    className={`${styles.resolveButton} ${isRevealing ? styles.revealing : ''}`}
                    onClick={handleReveal}
                    disabled={isRevealing}
                >
                    {isRevealing ? 'Revealing...' : 'Reveal Outcome'}
                </button>
            </div>
        </div>
    );
}
