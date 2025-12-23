/**
 * Dashboard Screen
 * 
 * Main game interface with union incubator and federation display
 */

import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import { getTotalDelegates, getAvailableUnions } from '../../engine/state';
import { ResourceBar } from '../components/ResourceBar';
import { UnionCard } from '../components/UnionCard';
import { EventModal } from '../components/EventModal';
import { TutorialModal } from '../components/TutorialModal';
import { ExplainerModal } from '../components/ExplainerModal';
import styles from './Dashboard.module.css';

export function Dashboard() {
    const {
        state,
        generateUnions,
        createFederation,
        drawRandomEvent,
    } = useGame();

    const [selectedUnions, setSelectedUnions] = useState<string[]>([]);

    const unions = Object.values(state.unions);
    const federations = Object.values(state.federations);
    const totalDelegates = getTotalDelegates(state);
    const availableUnions = getAvailableUnions(state);

    const canGenerateUnions = state.resources.paperwork >= 1 && !state.unionsGeneratedInCycle;
    const canCreateFederation = selectedUnions.length >= 2 &&
        state.resources.paperwork >= 2 &&
        state.resources.patronage >= 1;

    const handleGenerateUnions = () => {
        generateUnions(3);
    };

    const handleSelectUnion = (unionId: string) => {
        setSelectedUnions(prev => {
            if (prev.includes(unionId)) {
                return prev.filter(id => id !== unionId);
            }
            return [...prev, unionId];
        });
    };

    const handleCreateFederation = () => {
        if (canCreateFederation) {
            createFederation(selectedUnions);
            setSelectedUnions([]);
        }
    };

    const handleAdvanceTurn = () => {
        // Draw an event before advancing
        drawRandomEvent();
    };

    return (
        <div className={styles.container}>
            {state.showTips && <TutorialModal />}
            <ExplainerModal />
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.title}>
                    <h1>THE HATCHERY</h1>
                    <span className={styles.tagline}>"We increased representation by 22%. Workers not included."</span>
                </div>
                <div className={styles.cycleInfo}>
                    <span className={styles.cycleBadge}>Cycle {state.cycle}/{state.maxCycles}</span>
                    <span className={styles.delegateCount}>🗳️ {totalDelegates} Delegates</span>
                </div>
            </header>

            {/* Resources */}
            <ResourceBar />

            {/* Main Content */}
            <main className={styles.main}>
                {/* Union Incubator */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Union Incubator</h2>
                        <button
                            className={styles.actionButton}
                            onClick={handleGenerateUnions}
                            disabled={!canGenerateUnions}
                        >
                            {state.unionsGeneratedInCycle
                                ? "✅ Unions Generated"
                                : `🥚 Generate Unions (-1 📋)`}
                        </button>
                    </div>

                    {unions.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No unions in the incubator.</p>
                            <p className={styles.hint}>Generate some unions to get started.</p>
                        </div>
                    ) : (
                        <div className={styles.unionGrid}>
                            {unions.map(union => {
                                const isInFederation = Object.values(state.federations).some(
                                    f => f.unionIds.includes(union.id)
                                );
                                return (
                                    <UnionCard
                                        key={union.id}
                                        union={union}
                                        isSelected={selectedUnions.includes(union.id)}
                                        onSelect={handleSelectUnion}
                                        isInFederation={isInFederation}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Federation Builder */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Federations</h2>
                        {selectedUnions.length > 0 && (
                            <button
                                className={styles.actionButton}
                                onClick={handleCreateFederation}
                                disabled={!canCreateFederation}
                            >
                                🏛️ Create Federation ({selectedUnions.length} selected)
                            </button>
                        )}
                    </div>

                    {selectedUnions.length > 0 && (
                        <div className={styles.selectionInfo}>
                            <span>Selected: {selectedUnions.length} unions</span>
                            <button
                                className={styles.clearButton}
                                onClick={() => setSelectedUnions([])}
                            >
                                Clear
                            </button>
                            <span className={styles.hint}>
                                Need 2+ licensed unions, 2 Paperwork, 1 Patronage
                            </span>
                        </div>
                    )}

                    {federations.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No federations created.</p>
                            <p className={styles.hint}>
                                Select 2+ licensed unions and create a federation to gain delegates.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.federationList}>
                            {federations.map(fed => (
                                <div key={fed.id} className={styles.federationCard}>
                                    <div className={styles.fedHeader}>
                                        <h3>{fed.name}</h3>
                                        <span className={styles.delegateBadge}>🗳️ {fed.delegates}</span>
                                    </div>
                                    <div className={styles.fedMeta}>
                                        <span className={fed.recognition === 'recognized' ? styles.recognized : styles.unrecognized}>
                                            {fed.recognition}
                                        </span>
                                        <span>{fed.unionIds.length} unions</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Footer Actions */}
            <footer className={styles.footer}>
                <div className={styles.footerInfo}>
                    <span>Available unions: {availableUnions.length}</span>
                    <span>•</span>
                    <span>Total federations: {federations.length}</span>
                </div>
                <button
                    className={styles.advanceButton}
                    onClick={handleAdvanceTurn}
                >
                    Advance to Next Cycle →
                </button>
            </footer>

            {/* Event Modal */}
            <EventModal />
        </div>
    );
}
