
import { useGame } from '../../app/GameProvider';
import { EXPLAINER_CONTENT } from '../../content/explainers';
import styles from './TutorialModal.module.css'; // Reusing modal styles

export function ExplainerModal() {
    const { activeExplainer, hideExplainer } = useGame();

    if (!activeExplainer) return null;

    const content = EXPLAINER_CONTENT[activeExplainer] || {
        title: activeExplainer,
        description: 'No detailed record available for this item.'
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            hideExplainer();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal} style={{ maxWidth: '400px' }}>
                <header className={styles.header}>
                    <h2>{content.title}</h2>
                </header>

                <div className={styles.content}>
                    <section className={styles.section}>
                        <p>{content.description}</p>
                    </section>
                </div>

                <footer className={styles.footer} style={{ marginTop: '1.5rem' }}>
                    <button className={styles.button} onClick={hideExplainer} style={{ padding: '0.75rem 2rem' }}>
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
