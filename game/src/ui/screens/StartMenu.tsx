/**
 * Start Menu Screen
 * 
 * Initial landing page to start a new game
 */

import { useState } from 'react';
import { useGame } from '../../app/GameProvider';
import styles from './StartMenu.module.css';

export function StartMenu() {
    const { startGame, isLoading, error } = useGame();
    const [seed, setSeed] = useState('');

    const handleStart = () => {
        console.log('=== [StartMenu] Start New Run button clicked ===');
        console.log('[StartMenu] Raw seed value:', seed);
        const seedNumber = seed ? parseInt(seed, 10) : undefined;
        console.log('[StartMenu] Parsed seed number:', seedNumber);
        console.log('[StartMenu] Calling startGame function...');
        startGame(seedNumber, false);
        console.log('[StartMenu] startGame function called');
    };

    const handleStartWithTips = () => {
        const seedNumber = seed ? parseInt(seed, 10) : undefined;
        startGame(seedNumber, true);
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <p>Loading content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>Error Loading Game</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.logo}>
                    <h1>THE HATCHERY</h1>
                    <p className={styles.tagline}>
                        "We increased representation by 22%.<br />
                        Workers not included."
                    </p>
                </div>

                <div className={styles.description}>
                    <p>
                        Welcome to the Union Incubator. Your task is simple: create federations,
                        accumulate delegates, and win the labor election.
                    </p>
                    <p className={styles.hint}>
                        How you achieve this is entirely up to you.
                    </p>
                </div>

                <div className={styles.controls}>
                    <button
                        className={styles.startButton}
                        onClick={handleStart}
                    >
                        Start New Run
                    </button>

                    <button
                        className={`${styles.startButton} ${styles.tipsButton}`}
                        onClick={handleStartWithTips}
                    >
                        Start with Tips
                    </button>

                    <div className={styles.seedInput}>
                        <label htmlFor="seed">Seed (optional)</label>
                        <input
                            id="seed"
                            type="text"
                            placeholder="Enter seed for reproducible run"
                            value={seed}
                            onChange={(e) => setSeed(e.target.value)}
                        />
                    </div>
                </div>

                <footer className={styles.footer}>
                    <p>A satirical simulation about labor representation</p>
                </footer>
            </div>
            <div className={styles.background} />
        </div>
    );
}
