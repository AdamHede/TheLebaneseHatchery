/**
 * EventModal Component
 * 
 * Displays the current event with choices and applies effects
 */

import { useGame, useCurrentEvent } from '../../app/GameProvider';
import { getEligibleChoices } from '../../content/loadContent';
import styles from './EventModal.module.css';

export function EventModal() {
    const { state, chooseEventOption } = useGame();
    const event = useCurrentEvent();

    if (!event || state.phase !== 'event') {
        return null;
    }

    const eligibleChoices = getEligibleChoices(event, state);

    const handleChoice = (choiceId: string) => {
        chooseEventOption(event.id, choiceId);
    };

    const formatEffect = (key: string, value: number): string => {
        const sign = value > 0 ? '+' : '';
        const icons: Record<string, string> = {
            paperwork: '📋',
            patronage: '🤝',
            legitimacy: '⚖️',
            auditRisk: '🔍',
            streetHeat: '🔥',
        };
        return `${icons[key] || ''} ${sign}${value}`;
    };

    const resolveAssetPath = (path: string) => {
        if (!path || path.startsWith('http')) return path;
        const baseUrl = import.meta.env.BASE_URL;
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        return `${baseUrl}${cleanPath}`;
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.category}>{event.category.toUpperCase()}</div>

                {event.image && (
                    <div className={styles.imageContainer}>
                        <img
                            src={resolveAssetPath(event.image)}
                            alt={event.headline}
                            className={styles.eventImage}
                        />
                    </div>
                )}

                <h2 className={styles.headline}>{event.headline}</h2>

                <p className={styles.flavor}>{event.flavor}</p>

                <div className={styles.choices}>
                    {eligibleChoices.map((choice) => (
                        <button
                            key={choice.id}
                            className={styles.choice}
                            onClick={() => handleChoice(choice.id)}
                        >
                            <span className={styles.choiceLabel}>{choice.label}</span>
                            <div className={styles.effects}>
                                {Object.entries(choice.effects).map(([key, value]) => (
                                    <span
                                        key={key}
                                        className={`${styles.effect} ${value > 0 ? styles.positive : styles.negative}`}
                                    >
                                        {formatEffect(key, value)}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
