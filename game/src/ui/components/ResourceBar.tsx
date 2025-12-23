/**
 * ResourceBar Component
 * 
 * Displays all player resources with visual indicators
 */

import { useGame } from '../../app/GameProvider';
import styles from './ResourceBar.module.css';

export function ResourceBar() {
    const { state, showExplainer } = useGame();
    const { resources } = state;

    return (
        <div className={styles.container}>
            <div className={styles.resource} onClick={() => showExplainer('Paperwork')} style={{ cursor: 'pointer' }}>
                <span className={styles.icon}>📋</span>
                <span className={styles.label}>Paperwork</span>
                <span className={styles.value}>{resources.paperwork}</span>
            </div>

            <div className={styles.resource} onClick={() => showExplainer('Patronage')} style={{ cursor: 'pointer' }}>
                <span className={styles.icon}>🤝</span>
                <span className={styles.label}>Patronage</span>
                <span className={styles.value}>{resources.patronage}</span>
            </div>

            <div className={styles.resource} onClick={() => showExplainer('Legitimacy')} style={{ cursor: 'pointer' }}>
                <span className={styles.icon}>⚖️</span>
                <span className={styles.label}>Legitimacy</span>
                <span className={styles.value}>{resources.legitimacy}%</span>
                <div className={styles.bar}>
                    <div
                        className={`${styles.fill} ${resources.legitimacy < 30 ? styles.danger : ''}`}
                        style={{ width: `${resources.legitimacy}%` }}
                    />
                </div>
            </div>

            <div className={styles.resource} onClick={() => showExplainer('Audit Risk')} style={{ cursor: 'pointer' }}>
                <span className={styles.icon}>🔍</span>
                <span className={styles.label}>Audit Risk</span>
                <span className={styles.value}>{resources.auditRisk}%</span>
                <div className={styles.bar}>
                    <div
                        className={`${styles.fill} ${styles.warning} ${resources.auditRisk > 70 ? styles.danger : ''}`}
                        style={{ width: `${resources.auditRisk}%` }}
                    />
                </div>
            </div>

            <div className={styles.resource} onClick={() => showExplainer('Street Heat')} style={{ cursor: 'pointer' }}>
                <span className={styles.icon}>🔥</span>
                <span className={styles.label}>Street Heat</span>
                <span className={styles.value}>{resources.streetHeat}%</span>
                <div className={styles.bar}>
                    <div
                        className={`${styles.fill} ${styles.warning} ${resources.streetHeat > 70 ? styles.danger : ''}`}
                        style={{ width: `${resources.streetHeat}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
