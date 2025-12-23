/**
 * Game Context and Provider
 * 
 * Wraps the game reducer and provides state + dispatch to all components
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import type { RunState } from '../engine/state';
import { createInitialState } from '../engine/state';
import { gameReducer, actions, type GameAction } from '../engine/reducer';
import type { ContentBundle, EventCard } from '../content/types';
import { loadContent, getEligibleEvents } from '../content/loadContent';
import { createRNG } from '../engine/rng';

// ============================================
// CONTEXT TYPES
// ============================================

type GameContextValue = {
    state: RunState;
    dispatch: React.Dispatch<GameAction>;
    content: ContentBundle | null;
    isLoading: boolean;
    error: string | null;
    activeExplainer: string | null;

    // Convenience actions
    startGame: (seed?: number, showTips?: boolean) => void;
    resetGame: () => void;
    dismissTutorial: () => void;
    showExplainer: (topic: string) => void;
    hideExplainer: () => void;
    generateUnions: (count: number) => void;
    licenseUnion: (unionId: string) => void;
    incubateUnion: (unionId: string, mode: 'paperwork' | 'discipline') => void;
    dissolveUnion: (unionId: string) => void;
    reassignUnion: (unionId: string) => void;
    createFederation: (unionIds: string[]) => void;
    advanceTurn: () => void;
    drawRandomEvent: () => void;
    chooseEventOption: (eventId: string, choiceId: string) => void;
    resolveElection: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(gameReducer, createInitialState());
    const [content, setContent] = useState<ContentBundle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeExplainer, setActiveExplainer] = useState<string | null>(null);

    // Load content on mount
    useEffect(() => {
        console.log('[GameProvider] Loading content...');
        loadContent()
            .then((content) => {
                console.log('[GameProvider] Content loaded successfully:', {
                    eventCount: content.events.length,
                    footnoteCount: content.footnotes.length
                });
                setContent(content);
            })
            .catch((err) => {
                console.error('[GameProvider] Error loading content:', err);
                setError(err.message);
            })
            .finally(() => {
                console.log('[GameProvider] Content loading complete, isLoading = false');
                setIsLoading(false);
            });
    }, []);

    // ----------------------------------------
    // Convenience Actions
    // ----------------------------------------

    const startGame = useCallback((seed?: number, showTips?: boolean) => {
        console.log('=== [GameProvider] startGame called ===');
        console.log('[GameProvider] Current state phase:', state.phase);
        console.log('[GameProvider] Seed:', seed);
        console.log('[GameProvider] ShowTips:', showTips);
        console.log('[GameProvider] Content loaded:', content !== null);
        console.log('[GameProvider] Dispatching startRun action...');
        dispatch(actions.startRun(seed, showTips));
        console.log('[GameProvider] startRun action dispatched');
    }, [state.phase, content]);

    const resetGame = useCallback(() => {
        dispatch(actions.resetRun());
    }, []);

    const generateUnions = useCallback((count: number) => {
        dispatch(actions.generateUnions(count));
    }, []);

    const licenseUnion = useCallback((unionId: string) => {
        dispatch(actions.licenseUnion(unionId));
    }, []);

    const incubateUnion = useCallback((unionId: string, mode: 'paperwork' | 'discipline') => {
        dispatch(actions.incubateUnion(unionId, mode));
    }, []);

    const dissolveUnion = useCallback((unionId: string) => {
        dispatch(actions.dissolveUnion(unionId));
    }, []);

    const reassignUnion = useCallback((unionId: string) => {
        dispatch(actions.reassignUnion(unionId));
    }, []);

    const createFederation = useCallback((unionIds: string[]) => {
        dispatch(actions.createFederation(unionIds));
    }, []);

    const advanceTurn = useCallback(() => {
        dispatch(actions.advanceTurn());
    }, []);

    const drawRandomEvent = useCallback(() => {
        if (!content) return;

        const eligible = getEligibleEvents(content.events, state);
        if (eligible.length === 0) return;

        const rng = createRNG(state.rngCursor);
        const weights = eligible.map(e => e.weight);
        const event = rng.weightedPick(eligible, weights);

        dispatch(actions.drawEvent(event.id));
    }, [content, state]);

    const chooseEventOption = useCallback((eventId: string, choiceId: string) => {
        if (!content) return;

        const event = content.events.find(e => e.id === eventId);
        if (!event) return;

        const choice = event.choices.find(c => c.id === choiceId);
        if (!choice) return;

        dispatch(actions.chooseEvent(eventId, choiceId, choice.effects, choice.unlocks));
    }, [content]);

    const resolveElection = useCallback(() => {
        dispatch(actions.resolveElection());
    }, []);

    const dismissTutorial = useCallback(() => {
        dispatch(actions.dismissTutorial());
    }, []);

    const showExplainer = useCallback((topic: string) => {
        setActiveExplainer(topic);
    }, []);

    const hideExplainer = useCallback(() => {
        setActiveExplainer(null);
    }, []);

    // ----------------------------------------
    // Context Value
    // ----------------------------------------

    const value: GameContextValue = {
        state,
        dispatch,
        content,
        isLoading,
        error,
        startGame,
        resetGame,
        generateUnions,
        licenseUnion,
        incubateUnion,
        dissolveUnion,
        reassignUnion,
        createFederation,
        advanceTurn,
        drawRandomEvent,
        chooseEventOption,
        resolveElection,
        dismissTutorial,
        activeExplainer,
        showExplainer,
        hideExplainer,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useGame(): GameContextValue {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

// ============================================
// SELECTORS HOOKS
// ============================================

export function useCurrentEvent(): EventCard | null {
    const { state, content } = useGame();

    if (!content || !state.currentEventId) return null;

    return content.events.find(e => e.id === state.currentEventId) ?? null;
}
