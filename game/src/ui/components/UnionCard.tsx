/**
 * UnionCard Component
 * 
 * Displays a single union with its stats and available actions.
 * Shows tangible probabilities instead of abstract bars.
 */

import type { UnionEntity } from '../../engine/state';
import { getLicenseChance, getCrackRisk, getDelegateReliability, getDissolveReward, getReassignReward } from '../../engine/state';
import { useGame } from '../../app/GameProvider';
import styles from './UnionCard.module.css';

type Props = {
    union: UnionEntity;
    isSelected?: boolean;
    onSelect?: (unionId: string) => void;
    isInFederation?: boolean;
};

export function UnionCard({ union, isSelected, onSelect, isInFederation }: Props) {
    const { state, licenseUnion, incubateUnion, dissolveUnion, reassignUnion, showExplainer } = useGame();
    const { resources } = state;

    const canLicense = !union.isLicensed && !union.isCracked && resources.paperwork >= 1;
    const canIncubate = !union.isIncubated && !union.isCracked && resources.patronage >= 2;

    // Calculate probabilities
    const licenseChance = getLicenseChance(union);
    const crackRisk = getCrackRisk(union);
    const delegateReliability = getDelegateReliability(union);

    // Calculate what incubation would change
    const paperworkPreview = {
        licenseChange: Math.min(100, union.plausibility + 15) * 0.6 + 30 - licenseChance,
        crackChange: crackRisk - Math.max(5, 40 - Math.floor((union.integrity + 10) * 0.35)),
        loyaltyChange: -10,
    };
    const disciplinePreview = {
        licenseChange: Math.max(0, union.plausibility - 10) * 0.6 + 30 - licenseChance,
        crackChange: crackRisk - Math.max(5, 40 - Math.floor((union.integrity + 10) * 0.35)),
        loyaltyChange: 15,
    };

    const handleLicense = (e: React.MouseEvent) => {
        e.stopPropagation();
        licenseUnion(union.id);
    };

    const handleIncubatePaperwork = (e: React.MouseEvent) => {
        e.stopPropagation();
        incubateUnion(union.id, 'paperwork');
    };

    const handleIncubateDiscipline = (e: React.MouseEvent) => {
        e.stopPropagation();
        incubateUnion(union.id, 'discipline');
    };

    const handleDissolve = (e: React.MouseEvent) => {
        e.stopPropagation();
        dissolveUnion(union.id);
    };

    const handleReassign = (e: React.MouseEvent) => {
        e.stopPropagation();
        reassignUnion(union.id);
    };

    const handleClick = () => {
        if (union.isLicensed && !union.isCracked && onSelect) {
            onSelect(union.id);
        }
    };

    // Color coding for probabilities
    const getLicenseColor = (chance: number) => {
        if (chance >= 70) return '#4ade80';
        if (chance >= 50) return '#fbbf24';
        return '#f87171';
    };

    const getCrackColor = (risk: number) => {
        if (risk <= 10) return '#4ade80';
        if (risk <= 25) return '#fbbf24';
        return '#f87171';
    };

    const getReliabilityColor = (rel: number) => {
        if (rel >= 1.5) return '#4ade80';
        if (rel >= 1.0) return '#fbbf24';
        return '#f87171';
    };

    return (
        <div
            className={`${styles.card} ${isSelected ? styles.selected : ''} ${union.isLicensed ? styles.licensed : ''} ${union.isCracked ? styles.cracked : ''}`}
            onClick={handleClick}
        >
            <div className={styles.header}>
                <h3 className={styles.name}>{union.name}</h3>
                <span className={styles.sector}>{union.sector}</span>
            </div>

            {/* Probability Stats */}
            <div className={styles.probabilityStats}>
                <div
                    className={styles.probabilityStat}
                    onClick={(e) => { e.stopPropagation(); showExplainer('Plausibility'); }}
                    style={{ cursor: 'help' }}
                >
                    <span className={styles.probLabel}>License chance</span>
                    <span
                        className={styles.probValue}
                        style={{ color: getLicenseColor(licenseChance) }}
                    >
                        {licenseChance}%
                    </span>
                </div>

                <div
                    className={styles.probabilityStat}
                    onClick={(e) => { e.stopPropagation(); showExplainer('Integrity'); }}
                    style={{ cursor: 'help' }}
                >
                    <span className={styles.probLabel}>Crack risk</span>
                    <span
                        className={styles.probValue}
                        style={{ color: getCrackColor(crackRisk) }}
                    >
                        {crackRisk}%/cycle
                    </span>
                </div>

                {isInFederation && (
                    <div
                        className={styles.probabilityStat}
                        onClick={(e) => { e.stopPropagation(); showExplainer('Loyalty'); }}
                        style={{ cursor: 'help' }}
                    >
                        <span className={styles.probLabel}>Reliability</span>
                        <span
                            className={styles.probValue}
                            style={{ color: getReliabilityColor(delegateReliability) }}
                        >
                            {delegateReliability.toFixed(1)}/2
                        </span>
                    </div>
                )}
            </div>

            {/* Raw Stats (smaller, secondary) */}
            <div className={styles.rawStats}>
                <span className={styles.rawStat} title="Plausibility">📄 {union.plausibility}</span>
                <span className={styles.rawStat} title="Loyalty">🤝 {union.loyalty}</span>
                <span className={styles.rawStat} title="Integrity">⚖️ {union.integrity}</span>
            </div>

            <div className={styles.tags}>
                {union.isCracked && (
                    <span className={`${styles.tag} ${styles.crackedTag}`}>
                        💔 CRACKED
                    </span>
                )}
                {union.tags.map(tag => {
                    const isShell = tag === 'compliant' || tag === 'shell';
                    const displayTag = isShell ? '⚠️ SHELL' : tag;
                    const tagStyle = isShell ? `${styles.tag} ${styles.shellTag}` : styles.tag;

                    return (
                        <span
                            key={tag}
                            className={tagStyle}
                            onClick={(e) => { e.stopPropagation(); showExplainer(tag); }}
                            style={{ cursor: 'help' }}
                        >
                            {displayTag}
                        </span>
                    );
                })}
                {union.isLicensed && (
                    <span
                        className={`${styles.tag} ${styles.licensedTag}`}
                        onClick={(e) => { e.stopPropagation(); showExplainer('Licensed'); }}
                        style={{ cursor: 'help' }}
                    >
                        Licensed
                    </span>
                )}
                {union.isIncubated && (
                    <span
                        className={`${styles.tag} ${styles.incubatedTag}`}
                        onClick={(e) => { e.stopPropagation(); showExplainer('Incubated'); }}
                        style={{ cursor: 'help' }}
                    >
                        {union.incubationMode === 'paperwork' ? '📋 Paperwork' : '⚙️ Discipline'}
                    </span>
                )}
            </div>

            <div className={styles.footer}>
                <span className={styles.cost}>
                    Maintenance: {union.maintenanceCost}/cycle
                </span>
            </div>

            <div className={styles.actions}>
                {!union.isLicensed && !union.isCracked && (
                    <button
                        className={styles.button}
                        onClick={handleLicense}
                        disabled={!canLicense}
                        title={canLicense ? `License this union (${licenseChance}% chance, -1 Paperwork)` : 'Not enough Paperwork'}
                    >
                        📋 License ({licenseChance}%)
                    </button>
                )}
                {!union.isIncubated && !union.isCracked && (
                    <div className={styles.incubateActions}>
                        <button
                            className={`${styles.button} ${styles.incubateButton}`}
                            onClick={handleIncubatePaperwork}
                            disabled={!canIncubate}
                            title={canIncubate
                                ? `Clean the file: +${Math.round(paperworkPreview.licenseChange)}% license, -${Math.round(paperworkPreview.crackChange)}% crack, ${paperworkPreview.loyaltyChange} loyalty`
                                : 'Not enough Patronage'}
                        >
                            📋 Paperwork
                        </button>
                        <button
                            className={`${styles.button} ${styles.incubateButton}`}
                            onClick={handleIncubateDiscipline}
                            disabled={!canIncubate}
                            title={canIncubate
                                ? `Tighten control: ${Math.round(disciplinePreview.licenseChange)}% license, -${Math.round(disciplinePreview.crackChange)}% crack, +${disciplinePreview.loyaltyChange} loyalty`
                                : 'Not enough Patronage'}
                        >
                            ⚙️ Discipline
                        </button>
                    </div>
                )}
            </div>

            {/* Harvest Actions */}
            <div className={styles.harvestActions}>
                <button
                    className={`${styles.button} ${styles.dissolveButton}`}
                    onClick={handleDissolve}
                    disabled={isInFederation}
                    title={isInFederation ? 'Cannot dissolve unions in federations' : `Dissolve for ${getDissolveReward(union)} Paperwork`}
                >
                    💼 Dissolve (+{getDissolveReward(union)} 📋)
                </button>
                <button
                    className={`${styles.button} ${styles.reassignButton}`}
                    onClick={handleReassign}
                    disabled={isInFederation}
                    title={isInFederation ? 'Cannot reassign unions in federations' : `Reassign for ${getReassignReward(union)} Patronage`}
                >
                    🤝 Reassign (+{getReassignReward(union)} 🤝)
                </button>
            </div>

            {/* Incubation Preview */}
            {!union.isIncubated && !union.isCracked && canIncubate && (
                <div className={styles.incubatePreview}>
                    <span className={styles.previewLabel}>Incubate effects (-2 Patronage):</span>
                    <div className={styles.previewOptions}>
                        <span className={styles.previewOption}>
                            📋 License +{Math.round(paperworkPreview.licenseChange)}%, Crack -{Math.round(paperworkPreview.crackChange)}%, Loyalty {paperworkPreview.loyaltyChange}
                        </span>
                        <span className={styles.previewOption}>
                            ⚙️ License {Math.round(disciplinePreview.licenseChange)}%, Crack -{Math.round(disciplinePreview.crackChange)}%, Loyalty +{disciplinePreview.loyaltyChange}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
