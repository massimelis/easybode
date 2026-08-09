
        lucide.createIcons();
        let magChart, phaseChart;

        // ── Click-to-activate wheel zoom ─────────────────────────────────
        // Wheel-zoom is disabled by default on every chart so that scrolling
        // the page while the cursor happens to pass over a chart doesn't
        // hijack the scroll. Clicking a chart "activates" it (enables wheel
        // zoom just for that one); clicking anywhere else deactivates all of
        // them again. Drag-to-pan and pinch-zoom stay always available,
        // since neither conflicts with normal page scrolling.
        const zoomableCanvasIds = new Set();
        function makeChartClickActivatable(chart, canvas) {
            if (!chart || !canvas) return;
            zoomableCanvasIds.add(canvas.id);
            // Charts are destroyed/recreated on every recalculation, but the
            // <canvas> element itself persists — bind the click listener
            // only once per canvas, and always resolve the *current* chart
            // via Chart.js's own registry (Chart.getChart) inside the
            // handler, so it never references a stale, destroyed instance.
            if (!canvas.dataset.zoomClickBound) {
                canvas.dataset.zoomClickBound = '1';
                canvas.addEventListener('click', () => activateChartZoom(canvas));
            }
        }
        function activateChartZoom(activeCanvas) {
            zoomableCanvasIds.forEach(id => {
                const canvas = document.getElementById(id);
                const chart = canvas && Chart.getChart(canvas);
                if (!chart) return;
                const isActive = canvas === activeCanvas;
                if (chart.options && chart.options.plugins && chart.options.plugins.zoom) {
                    chart.options.plugins.zoom.zoom.wheel.enabled = isActive;
                    chart.update('none');
                }
                canvas.classList.toggle('chart-zoom-active', isActive);
            });
        }
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'CANVAS') return;
            zoomableCanvasIds.forEach(id => {
                const canvas = document.getElementById(id);
                const chart = canvas && Chart.getChart(canvas);
                if (chart && chart.options && chart.options.plugins && chart.options.plugins.zoom) {
                    chart.options.plugins.zoom.zoom.wheel.enabled = false;
                    chart.update('none');
                }
                if (canvas) canvas.classList.remove('chart-zoom-active');
            });
        });
        let isDarkMode = false;
        let currentLang = 'it';
        let currentUnit = 'Hz';
        let activeLayers = { real: true, asymptotic: false, contributions: false };
        // Per-chart overrides so the magnitude and phase diagrams can be
        // shown/hidden independently via their own mini-dock — reset to
        // match the shared `activeLayers` (the floating dock) each time a
        // new calculation runs, but can diverge afterward per chart.
        let activeLayersMag = { real: true, asymptotic: false, contributions: false };
        let activeLayersPhase = { real: true, asymptotic: false, contributions: false };
        let contributionVisibilityMag = {};
        let contributionVisibilityPhase = {};
        let isInterfaceExpanded = false;

        let lastFreqDisplay = [], lastFreqRad = [], lastMagData = [], lastPhaseData = [], lastAsympMagData = [], lastAsympPhaseData = [], lastContributionCurves = [];
        let lastWc = null;              // gain-crossover frequency (rad/s), default sine frequency for the temporal study
        let currentSignal = 'step';     // currently selected input signal for the Time Response Study
        let temporalChart;              // Chart.js instance for the temporal response canvas
        let lastTemporalData = null;    // cached { t, u, y, kpis } for the PDF export
        let nyquistChart;                // Chart.js instance for the Nyquist canvas
        let lastNyquistData = null;      // cached { posBranch, negBranch, P, N, Z, minDist, stable } for the PDF export
        let contributionVisibility = {};
        

        const frequenciesHz = [];
        for (let dec = -2; dec <= 9; dec += 0.05) frequenciesHz.push(Math.pow(10, dec));


    const LANG = 
    {
        it: {
            title: 'Benvenuto in <span class="font-bold"> Easy Bode </span>',
            subtitle: 'Il modo più semplice e veloce per studiare online la stabilità e la risposta dei sistemi di controllo.',
            placeholder: 'Scrivi la tua funzione di trasferimento...',
            calcBtn: 'CALCOLA', unitHz: 'Unità: Hz', unitRad: 'Unità: rad/s',
            pdfBtn: 'Scarica PDF', previewLabel: 'Anteprima G(s):',
            syntaxError: '⚠️ Errore di sintassi nella formula!',
            olStabilityLabel: 'Stabilità Anello Aperto G(s)', olStable: 'STABILE', olUnstable: 'INSTABILE (poli s.p.d.)', olNonMinPhase: 'A FASE NON MINIMA (zero s.p.d.)',
            navHome: 'Home', navTour: 'Tour', navDocs: 'Docs',
            catBasicPoles: 'Funzioni di Base (Poli Reali)', catZerosIntDiff: 'Zeri, Integratori e Differenziatori', cat2ndOrder: 'Sistemi del 2° Ordine e Risonanze', catCompensators: 'Reti Correttrici e Fase Non Minima', catControllers: 'Regolatori Standard', catFilters: 'Filtri Speciali', catPhysicalModels: 'Modelli Fisici Classici',
            exSimplePole: 'Polo reale semplice', exPoleTimeConst: 'Polo reale (costante di tempo)', exDoublePole: 'Polo reale doppio', exTwoPoles: 'Due poli reali distinti', ex3rdOrder: 'Sistema del 3° ordine (tre poli reali)', exWideSeparatedPoles: 'Poli a frequenze molto distanti',
            exIntegrator: 'Integratore (polo nell\'origine)', exDoubleIntegrator: 'Doppio integratore', exIdealDiff: 'Differenziatore ideale (zero nell\'origine)', exRealDiff: 'Differenziatore reale (filtro passa-alto)',
            exUnderdamped: '2° ordine sottosmorzato', exOverdamped: '2° ordine sovrasmorzato', exPureOscillator: 'Oscillatore puro (smorzamento nullo)',
            exLeadNetwork: 'Zero reale (rete anticipatrice)', exLagNetwork: 'Rete attenuatrice (lag)', exLeadLagNetwork: 'Rete anticipo-ritardo', exRHPZero: 'Zero nel semipiano destro (fase non minima)', exPadeDelay: 'Ritardo di tempo (Padé 1° ordine)',
            exPIController: 'Regolatore PI (Proporzionale-Integrale)', exPIDController: 'Regolatore PID (forma parallela)',
            exNotchFilter: 'Filtro notch (elimina-banda)',
            exMassSpringDamper: 'Massa-Molla-Smorzatore (M=1, B=0.5, K=4)', exDCMotorSpeed: 'Motore DC: Velocità (1° ordine)', exDCMotorPosition: 'Motore DC: Posizione (con integratore)', exRCCircuit: 'Circuito Elettrico RC (Passa-basso)', exInvertedPendulum: 'Pendolo Inverso (sistema instabile)', exThermalProcess: 'Processo Termico (dinamica molto lenta)', exElectromechanical: 'Sistema Elettromeccanico Generico (3° ordine)',
            historyBtn: 'Storico Funzioni', examplesBtn: 'Esempi Suggeriti', historyEmpty: 'Nessuna funzione salvata',
            w1: 'Stabilità & Robustezza', pm: 'Margine di Fase', wc: 'Freq. Taglio (𝜔c)',
            gm: 'Margine Guadagno', w180: 'Freq. Inversione (𝜔180)',
            clStab: 'Stabilità Anello Chiuso', stable: 'STABILE', unstable: 'INSTABILE',
            w2: 'Struttura F.d.T.', staticGain: 'Guadagno Stat. (𝘒₀)', sysType: 'Tipo Sistema (𝘨)',
            sysOrder: 'Ordine del Sistema', zeros: 'Zeri Estratti', poles: 'Poli Estratti',
            w3: 'Analisi & Filtro', resPeak: 'Picco di Risonanza', slopeInit: 'Pendenza Iniz.',
            slopeFinal: 'Pendenza Fin.', bandwidth: 'Banda Passante', filterBeh: 'Comportamento Filtro',
            titleMag: 'Diagramma del Modulo (Magnitudo)', titlePhase: 'Diagramma della Fase',
            real: 'Reale', asymp: 'Asintoti', contrib: 'Contributi',
            lp: 'Passa-Basso', hp: 'Passa-Alto', bp: 'Passa-Banda', ap: 'Pass-Tutto', notch: 'Notch',
            absent: 'Assente', nd: 'N/D',
            poleWord: 'Polo', zeroWord: 'Zero', ccWord: 'c.c.', originWord: 'origine',
            temporalTitle: 'Studio della Risposta Temporale', sigStep: 'Gradino Unitario', sigImpulse: 'Impulso', sigRamp: 'Rampa', sigSquare: 'Onda Quadra', sigSine: 'Sinusoide', lblYss: 'Valore di Regime', lblEss: 'Errore a Regime', lblTr: 'Tempo di Salita', lblTs: 'Tempo di Assestamento', lblOvershoot: 'Sovraelongazione Max', inputLbl: 'Ingresso', outputLbl: 'Uscita',
            nyquistTitle: 'Diagramma di Nyquist', lblP: 'Poli Instabili (P)', lblN: 'Avvolgimenti (N)', lblZ: 'Poli Instabili A.C. (Z)', lblDist: 'Distanza min. da (-1,0)',
            nyquistZoomHint: 'Scorri per zoom, trascina per spostare. Il PDF salverà l\'ultimo zoom e l\'ultimo trascinamento da te scelto.', nyquistResetZoom: 'Reset Zoom',
            nicholsTitle: 'Diagramma di Nichols', hallChart: 'Carta di Hall', semilogChart: 'Carta Semilog'
        },
        en: {
            title: 'Welcome to <span class="font-bold"> Easy Bode </span>',
            subtitle: 'The easiest and fastest way to study the stability and response of control systems online.',
            placeholder: 'Type your transfer function...',
            calcBtn: 'CALCULATE', unitHz: 'Unit: Hz', unitRad: 'Unit: rad/s',
            pdfBtn: 'Download PDF', previewLabel: 'Preview G(s):',
            syntaxError: '⚠️ Syntax error in formula!',
            olStabilityLabel: 'Open-Loop Stability G(s)', olStable: 'STABLE', olUnstable: 'UNSTABLE (RHP pole)', olNonMinPhase: 'NON-MINIMUM PHASE (RHP zero)',
            navHome: 'Home', navTour: 'Tour', navDocs: 'Docs',
            catBasicPoles: 'Basic Functions (Real Poles)', catZerosIntDiff: 'Zeros, Integrators & Differentiators', cat2ndOrder: '2nd Order Systems & Resonances', catCompensators: 'Compensator Networks & Non-Minimum Phase', catControllers: 'Standard Controllers', catFilters: 'Special Filters', catPhysicalModels: 'Classic Physical Models',
            exSimplePole: 'Simple real pole', exPoleTimeConst: 'Real pole (time constant)', exDoublePole: 'Double real pole', exTwoPoles: 'Two distinct real poles', ex3rdOrder: '3rd order system (three real poles)', exWideSeparatedPoles: 'Poles at widely separated frequencies',
            exIntegrator: 'Integrator (pole at the origin)', exDoubleIntegrator: 'Double integrator', exIdealDiff: 'Ideal differentiator (zero at the origin)', exRealDiff: 'Real differentiator (high-pass filter)',
            exUnderdamped: 'Underdamped 2nd order', exOverdamped: 'Overdamped 2nd order', exPureOscillator: 'Pure oscillator (zero damping)',
            exLeadNetwork: 'Real zero (lead network)', exLagNetwork: 'Lag network', exLeadLagNetwork: 'Lead-lag network', exRHPZero: 'Right Half-Plane zero (non-minimum phase)', exPadeDelay: 'Time delay (1st order Padé)',
            exPIController: 'PI Controller (Proportional-Integral)', exPIDController: 'PID Controller (parallel form)',
            exNotchFilter: 'Notch filter (band-stop)',
            exMassSpringDamper: 'Mass-Spring-Damper (M=1, B=0.5, K=4)', exDCMotorSpeed: 'DC Motor: Speed (1st order)', exDCMotorPosition: 'DC Motor: Position (with integrator)', exRCCircuit: 'RC Electrical Circuit (Low-pass)', exInvertedPendulum: 'Inverted Pendulum (Unstable system)', exThermalProcess: 'Thermal Process (Very slow dynamics)', exElectromechanical: 'Generic Electromechanical System (3rd order)',
            historyBtn: 'Function History', examplesBtn: 'Suggested Examples', historyEmpty: 'No saved functions',
            w1: 'Stability & Robustness', pm: 'Phase Margin', wc: 'Crossover Freq. (𝜔c)',
            gm: 'Gain Margin', w180: 'Phase Cross. Freq. (𝜔180)',
            clStab: 'Closed-Loop Stability', stable: 'STABLE', unstable: 'UNSTABLE',
            w2: 'TF Structure', staticGain: 'Static Gain (𝘒₀)', sysType: 'System Type (𝘨)',
            sysOrder: 'System Order', zeros: 'Extracted Zeros', poles: 'Extracted Poles',
            w3: 'Analysis & Filter', resPeak: 'Resonance Peak', slopeInit: 'Init. Slope',
            slopeFinal: 'Final Slope', bandwidth: 'Bandwidth', filterBeh: 'Filter Behaviour',
            titleMag: 'Magnitude Diagram (dB)', titlePhase: 'Phase Diagram',
            real: 'Real', asymp: 'Asymp.', contrib: 'Contrib.',
            lp: 'Low-Pass', hp: 'High-Pass', bp: 'Band-Pass', ap: 'All-Pass', notch: 'Notch',
            absent: 'None', nd: 'N/A',
            poleWord: 'Pole', zeroWord: 'Zero', ccWord: 'cc', originWord: 'origin',
            temporalTitle: 'Time Response Study', sigStep: 'Unit Step', sigImpulse: 'Impulse', sigRamp: 'Ramp', sigSquare: 'Square Wave', sigSine: 'Sine Wave', lblYss: 'Steady-State Value', lblEss: 'Steady-State Error', lblTr: 'Rise Time', lblTs: 'Settling Time', lblOvershoot: 'Max Overshoot', inputLbl: 'Input', outputLbl: 'Output',
            nyquistTitle: 'Nyquist Diagram', lblP: 'Unstable Poles (P)', lblN: 'Encirclements (N)', lblZ: 'Unstable CL Poles (Z)', lblDist: 'Min. Distance from (-1,0)',
            nyquistZoomHint: 'Scroll to zoom, drag to pan. The PDF will save the last zoom and pan you chose.', nyquistResetZoom: 'Reset Zoom',
            nicholsTitle: 'Nichols Chart', hallChart: 'Hall Chart', semilogChart: 'Semilog Chart'
        },
        fr: {
            title: 'Bienvenue sur <span class="font-bold"> Easy Bode </span>',
            subtitle: 'Le moyen le plus simple et le plus rapide d\'étudier en ligne la stabilité et la réponse des systèmes de contrôle.',
            placeholder: 'Écrivez votre fonction de transfert...',
            calcBtn: 'CALCULER', unitHz: 'Unité: Hz', unitRad: 'Unité: rad/s',
            pdfBtn: 'Télécharger PDF', previewLabel: 'Aperçu G(s):',
            syntaxError: '⚠️ Erreur de syntaxe dans la formule!',
            olStabilityLabel: 'Stabilité en Boucle Ouverte G(s)', olStable: 'STABLE', olUnstable: 'INSTABLE (pôle instable)', olNonMinPhase: 'PHASE NON MINIMALE (zéro instable)',
            navHome: 'Accueil', navTour: 'Visite', navDocs: 'Docs',
            catBasicPoles: 'Fonctions de Base (Pôles Réels)', catZerosIntDiff: 'Zéros, Intégrateurs et Différentiateurs', cat2ndOrder: 'Systèmes du 2e Ordre et Résonances', catCompensators: 'Réseaux Correcteurs et Phase Non Minimale', catControllers: 'Régulateurs Standards', catFilters: 'Filtres Spéciaux', catPhysicalModels: 'Modèles Physiques Classiques',
            exSimplePole: 'Pôle réel simple', exPoleTimeConst: 'Pôle réel (constante de temps)', exDoublePole: 'Pôle réel double', exTwoPoles: 'Deux pôles réels distincts', ex3rdOrder: 'Système du 3e ordre (trois pôles réels)', exWideSeparatedPoles: 'Pôles à fréquences très éloignées',
            exIntegrator: 'Intégrateur (pôle à l\'origine)', exDoubleIntegrator: 'Double intégrateur', exIdealDiff: 'Différentiateur idéal (zéro à l\'origine)', exRealDiff: 'Différentiateur réel (filtre passe-haut)',
            exUnderdamped: '2e ordre sous-amorti', exOverdamped: '2e ordre sur-amorti', exPureOscillator: 'Oscillateur pur (amortissement nul)',
            exLeadNetwork: 'Zéro réel (réseau à avance de phase)', exLagNetwork: 'Réseau à retard de phase', exLeadLagNetwork: 'Réseau avance-retard', exRHPZero: 'Zéro dans le demi-plan droit (phase non minimale)', exPadeDelay: 'Retard temporel (Padé 1er ordre)',
            exPIController: 'Régulateur PI (Proportionnel-Intégral)', exPIDController: 'Régulateur PID (forme parallèle)',
            exNotchFilter: 'Filtre coupe-bande (notch)',
            exMassSpringDamper: 'Masse-Ressort-Amortisseur (M=1, B=0.5, K=4)', exDCMotorSpeed: 'Moteur CC : Vitesse (1er ordre)', exDCMotorPosition: 'Moteur CC : Position (avec intégrateur)', exRCCircuit: 'Circuit Électrique RC (Passe-bas)', exInvertedPendulum: 'Pendule Inversé (système instable)', exThermalProcess: 'Processus Thermique (dynamique très lente)', exElectromechanical: 'Système Électromécanique Générique (3e ordre)',
            historyBtn: 'Historique des Fonctions', examplesBtn: 'Exemples Suggérés', historyEmpty: 'Aucune fonction enregistrée',
            w1: 'Stabilité & Robustesse', pm: 'Marge de Phase', wc: 'Fréq. Coupure (𝜔c)',
            gm: 'Marge de Gain', w180: 'Fréq. Phase 180° (𝜔180)',
            clStab: 'Stabilité Boucle Fermée', stable: 'STABLE', unstable: 'INSTABLE',
            w2: 'Structure FdT', staticGain: 'Gain Statique (𝘒₀)', sysType: 'Type Système (𝘨)',
            sysOrder: "Ordre du Système", zeros: 'Zéros Extraits', poles: 'Pôles Extraits',
            w3: 'Analyse & Filtre', resPeak: 'Pic de Résonance', slopeInit: 'Pente Init.',
            slopeFinal: 'Pente Fin.', bandwidth: 'Bande Passante', filterBeh: 'Comportement Filtre',
            titleMag: 'Diagramme de Module (dB)', titlePhase: 'Diagramme de Phase',
            real: 'Réel', asymp: 'Asympt.', contrib: 'Contrib.',
            lp: 'Passe-Bas', hp: 'Passe-Haut', bp: 'Passe-Bande', ap: 'Passe-Tout', notch: 'Coupe-Bande',
            absent: 'Absent', nd: 'N/D',
            poleWord: 'Pôle', zeroWord: 'Zéro', ccWord: 'c.c.', originWord: 'origine',
            temporalTitle: 'Étude de la Réponse Temporelle', sigStep: 'Échelon Unitaire', sigImpulse: 'Impulsion', sigRamp: 'Rampe', sigSquare: 'Onde Carrée', sigSine: 'Sinusoïde', lblYss: 'Valeur de Régime', lblEss: 'Erreur de Régime', lblTr: 'Temps de Montée', lblTs: 'Temps d\'Établissement', lblOvershoot: 'Dépassement Max', inputLbl: 'Entrée', outputLbl: 'Sortie',
            nyquistTitle: 'Diagramme de Nyquist', lblP: 'Pôles Instables (P)', lblN: 'Encerclements (N)', lblZ: 'Pôles Instables B.F. (Z)', lblDist: 'Distance min. de (-1,0)',
            nyquistZoomHint: 'Molette pour zoomer, glisser pour déplacer. Le PDF conservera le dernier zoom et déplacement choisis.', nyquistResetZoom: 'Réinitialiser',
            nicholsTitle: 'Diagramme de Nichols', hallChart: 'Abaque de Hall', semilogChart: 'Papier Semilog'
        },
        de: {
            title: 'Willkommen bei <span class="font-bold"> Easy Bode </span>',
            subtitle: 'Der einfachste und schnellste Weg, um online die Stabilität und Antwort von Regelungssystemen zu studieren.',
            placeholder: 'Geben Sie Ihre Übertragungsfunktion ein...',
            calcBtn: 'BERECHNEN', unitHz: 'Einheit: Hz', unitRad: 'Einheit: rad/s',
            pdfBtn: 'PDF Herunterladen', previewLabel: 'Vorschau G(s):',
            syntaxError: '⚠️ Syntaxfehler in der Formel!',
            olStabilityLabel: 'Stabilität Offener Regelkreis G(s)', olStable: 'STABIL', olUnstable: 'INSTABIL (instabiler Pol)', olNonMinPhase: 'NICHTMINIMALPHASIG (instabile Nullstelle)',
            navHome: 'Start', navTour: 'Tour', navDocs: 'Docs',
            catBasicPoles: 'Grundfunktionen (Reelle Pole)', catZerosIntDiff: 'Nullstellen, Integratoren & Differenzierer', cat2ndOrder: 'Systeme 2. Ordnung & Resonanzen', catCompensators: 'Kompensationsnetzwerke & Nichtminimalphasig', catControllers: 'Standardregler', catFilters: 'Spezialfilter', catPhysicalModels: 'Klassische Physikalische Modelle',
            exSimplePole: 'Einfacher reeller Pol', exPoleTimeConst: 'Reeller Pol (Zeitkonstante)', exDoublePole: 'Doppelter reeller Pol', exTwoPoles: 'Zwei unterschiedliche reelle Pole', ex3rdOrder: 'System 3. Ordnung (drei reelle Pole)', exWideSeparatedPoles: 'Pole bei weit auseinanderliegenden Frequenzen',
            exIntegrator: 'Integrator (Pol im Ursprung)', exDoubleIntegrator: 'Doppelintegrator', exIdealDiff: 'Idealer Differenzierer (Nullstelle im Ursprung)', exRealDiff: 'Realer Differenzierer (Hochpassfilter)',
            exUnderdamped: 'Gedämpftes System 2. Ordnung (unterkritisch)', exOverdamped: 'System 2. Ordnung (überkritisch gedämpft)', exPureOscillator: 'Reiner Oszillator (keine Dämpfung)',
            exLeadNetwork: 'Reelle Nullstelle (Vorhaltnetzwerk)', exLagNetwork: 'Nachhaltnetzwerk (Lag)', exLeadLagNetwork: 'Vorhalt-Nachhalt-Netzwerk', exRHPZero: 'Nullstelle in der rechten Halbebene (nichtminimalphasig)', exPadeDelay: 'Zeitverzögerung (Padé 1. Ordnung)',
            exPIController: 'PI-Regler (Proportional-Integral)', exPIDController: 'PID-Regler (Parallelform)',
            exNotchFilter: 'Notch-Filter (Bandsperre)',
            exMassSpringDamper: 'Masse-Feder-Dämpfer (M=1, B=0.5, K=4)', exDCMotorSpeed: 'Gleichstrommotor: Drehzahl (1. Ordnung)', exDCMotorPosition: 'Gleichstrommotor: Position (mit Integrator)', exRCCircuit: 'RC-Schaltung (Tiefpass)', exInvertedPendulum: 'Inverses Pendel (instabiles System)', exThermalProcess: 'Thermischer Prozess (sehr langsame Dynamik)', exElectromechanical: 'Allgemeines Elektromechanisches System (3. Ordnung)',
            historyBtn: 'Funktionsverlauf', examplesBtn: 'Vorgeschlagene Beispiele', historyEmpty: 'Keine gespeicherten Funktionen',
            w1: 'Stabilität & Robustheit', pm: 'Phasenrand', wc: 'Durchtrittsfreq. (𝜔c)',
            gm: 'Amplitudenrand', w180: 'Phasenschnittfreq. (𝜔180)',
            clStab: 'Stabilität Geschl. Kreis', stable: 'STABIL', unstable: 'INSTABIL',
            w2: 'Übertr.-Struktur', staticGain: 'Stat. Verstärkung (𝘒₀)', sysType: 'Systemtyp (𝘨)',
            sysOrder: 'Systemordnung', zeros: 'Extrahierte Nullst.', poles: 'Extrahierte Pole',
            w3: 'Analyse & Filter', resPeak: 'Resonanzspitze', slopeInit: 'Anfangssteig.',
            slopeFinal: 'Endsteigung', bandwidth: 'Bandbreite', filterBeh: 'Filterverhalten',
            titleMag: 'Betragsdiagramm (dB)', titlePhase: 'Phasendiagramm',
            real: 'Real', asymp: 'Asympt.', contrib: 'Beitr.',
            lp: 'Tiefpass', hp: 'Hochpass', bp: 'Bandpass', ap: 'Allpass', notch: 'Bandsperre',
            absent: 'Keiner', nd: 'N/V',
            poleWord: 'Pol', zeroWord: 'Nullstelle', ccWord: 'k.k.', originWord: 'Ursprung',
            temporalTitle: 'Zeitantwort-Analyse', sigStep: 'Einheitssprung', sigImpulse: 'Impuls', sigRamp: 'Rampe', sigSquare: 'Rechteckwelle', sigSine: 'Sinuswelle', lblYss: 'Beharrungswert', lblEss: 'Regelabweichung', lblTr: 'Anstiegszeit', lblTs: 'Einschwingzeit', lblOvershoot: 'Max. Überschwingen', inputLbl: 'Eingang', outputLbl: 'Ausgang',
            nyquistTitle: 'Nyquist-Diagramm', lblP: 'Instabile Pole (P)', lblN: 'Umschlingungen (N)', lblZ: 'Instabile Pole g.K. (Z)', lblDist: 'Min. Abstand von (-1,0)',
            nyquistZoomHint: 'Scrollen zum Zoomen, Ziehen zum Verschieben. Das PDF speichert den zuletzt gewählten Zoom und die Verschiebung.', nyquistResetZoom: 'Zoom zurücksetzen',
            nicholsTitle: 'Nichols-Diagramm', hallChart: 'Hall-Diagramm', semilogChart: 'Semilog-Papier'
        },
        es: {
            title: 'Bienvenido a <span class="font-bold"> Easy Bode </span>',
            subtitle: 'La forma más simple y rápida de estudiar en línea la estabilidad y la respuesta de los sistemas de control.',
            placeholder: 'Escribe tu función de transferencia...',
            calcBtn: 'CALCULAR', unitHz: 'Unidad: Hz', unitRad: 'Unidad: rad/s',
            pdfBtn: 'Descargar PDF', previewLabel: 'Vista previa G(s):',
            syntaxError: '⚠️ Error de sintaxis en la fórmula!',
            olStabilityLabel: 'Estabilidad en Lazo Abierto G(s)', olStable: 'ESTABLE', olUnstable: 'INESTABLE (polo inestable)', olNonMinPhase: 'FASE NO MÍNIMA (cero inestable)',
            navHome: 'Inicio', navTour: 'Recorrido', navDocs: 'Docs',
            catBasicPoles: 'Funciones Básicas (Polos Reales)', catZerosIntDiff: 'Ceros, Integradores y Diferenciadores', cat2ndOrder: 'Sistemas de 2° Orden y Resonancias', catCompensators: 'Redes Compensadoras y Fase No Mínima', catControllers: 'Controladores Estándar', catFilters: 'Filtros Especiales', catPhysicalModels: 'Modelos Físicos Clásicos',
            exSimplePole: 'Polo real simple', exPoleTimeConst: 'Polo real (constante de tiempo)', exDoublePole: 'Polo real doble', exTwoPoles: 'Dos polos reales distintos', ex3rdOrder: 'Sistema de 3er orden (tres polos reales)', exWideSeparatedPoles: 'Polos en frecuencias muy alejadas',
            exIntegrator: 'Integrador (polo en el origen)', exDoubleIntegrator: 'Doble integrador', exIdealDiff: 'Diferenciador ideal (cero en el origen)', exRealDiff: 'Diferenciador real (filtro paso alto)',
            exUnderdamped: '2° orden subamortiguado', exOverdamped: '2° orden sobreamortiguado', exPureOscillator: 'Oscilador puro (amortiguamiento nulo)',
            exLeadNetwork: 'Cero real (red de adelanto)', exLagNetwork: 'Red de retardo (lag)', exLeadLagNetwork: 'Red de adelanto-retardo', exRHPZero: 'Cero en el semiplano derecho (fase no mínima)', exPadeDelay: 'Retardo temporal (Padé de 1er orden)',
            exPIController: 'Controlador PI (Proporcional-Integral)', exPIDController: 'Controlador PID (forma paralela)',
            exNotchFilter: 'Filtro notch (elimina-banda)',
            exMassSpringDamper: 'Masa-Resorte-Amortiguador (M=1, B=0.5, K=4)', exDCMotorSpeed: 'Motor DC: Velocidad (1er orden)', exDCMotorPosition: 'Motor DC: Posición (con integrador)', exRCCircuit: 'Circuito Eléctrico RC (Paso bajo)', exInvertedPendulum: 'Péndulo Invertido (sistema inestable)', exThermalProcess: 'Proceso Térmico (dinámica muy lenta)', exElectromechanical: 'Sistema Electromecánico Genérico (3er orden)',
            historyBtn: 'Historial de Funciones', examplesBtn: 'Ejemplos Sugeridos', historyEmpty: 'No hay funciones guardadas',
            w1: 'Estabilidad & Robustez', pm: 'Margen de Fase', wc: 'Frec. Corte (𝜔c)',
            gm: 'Margen de Ganancia', w180: 'Frec. Inversión (𝜔180)',
            clStab: 'Estabilidad Lazo Cerrado', stable: 'ESTABLE', unstable: 'INESTABLE',
            w2: 'Estructura FdT', staticGain: 'Ganancia Est. (𝘒₀)', sysType: 'Tipo Sistema (𝘨)',
            sysOrder: 'Orden del Sistema', zeros: 'Ceros Extraídos', poles: 'Polos Extraídos',
            w3: 'Análisis & Filtro', resPeak: 'Pico de Resonancia', slopeInit: 'Pend. Inic.',
            slopeFinal: 'Pend. Final', bandwidth: 'Ancho de Banda', filterBeh: 'Comportamiento Filtro',
            titleMag: 'Diagrama de Módulo (dB)', titlePhase: 'Diagrama de Fase',
            real: 'Real', asymp: 'Asint.', contrib: 'Contrib.',
            lp: 'Paso Bajo', hp: 'Paso Alto', bp: 'Paso Banda', ap: 'Paso Todo', notch: 'Rechazo Banda',
            absent: 'Ausente', nd: 'N/D',
            poleWord: 'Polo', zeroWord: 'Cero', ccWord: 'c.c.', originWord: 'origen',
            temporalTitle: 'Estudio de la Respuesta Temporal', sigStep: 'Escalón Unitario', sigImpulse: 'Impulso', sigRamp: 'Rampa', sigSquare: 'Onda Cuadrada', sigSine: 'Onda Senoidal', lblYss: 'Valor de Régimen', lblEss: 'Error de Régimen', lblTr: 'Tiempo de Subida', lblTs: 'Tiempo de Establecimiento', lblOvershoot: 'Sobreoscilación Máx.', inputLbl: 'Entrada', outputLbl: 'Salida',
            nyquistTitle: 'Diagrama de Nyquist', lblP: 'Polos Inestables (P)', lblN: 'Rodeos (N)', lblZ: 'Polos Inestables L.C. (Z)', lblDist: 'Distancia mín. a (-1,0)',
            nyquistZoomHint: 'Desplaza para zoom, arrastra para mover. El PDF guardará el último zoom y desplazamiento elegidos.', nyquistResetZoom: 'Restablecer Zoom',
            nicholsTitle: 'Diagrama de Nichols', hallChart: 'Carta de Hall', semilogChart: 'Papel Semilog'
        },
        zh: {
            title: '欢迎来到 <span class="font-bold"> Easy Bode </span>',
            subtitle: '在线学习控制系统稳定性与响应的最简单、最快捷的方式。',
            placeholder: '输入你的传递函数...',
            calcBtn: '计算', unitHz: '单位: Hz', unitRad: '单位: rad/s',
            pdfBtn: '下载 PDF', previewLabel: '预览 G(s):',
            syntaxError: '⚠️ 公式语法错误！',
            olStabilityLabel: '开环稳定性 G(s)', olStable: '稳定', olUnstable: '不稳定（右半平面极点）', olNonMinPhase: '非最小相位（右半平面零点）',
            navHome: '首页', navTour: '导览', navDocs: '文档',
            catBasicPoles: '基础函数（实极点）', catZerosIntDiff: '零点、积分器与微分器', cat2ndOrder: '二阶系统与谐振', catCompensators: '校正网络与非最小相位', catControllers: '标准控制器', catFilters: '特殊滤波器', catPhysicalModels: '经典物理模型',
            exSimplePole: '简单实极点', exPoleTimeConst: '实极点（时间常数）', exDoublePole: '二重实极点', exTwoPoles: '两个不同的实极点', ex3rdOrder: '三阶系统（三个实极点）', exWideSeparatedPoles: '频率相距很远的极点',
            exIntegrator: '积分器（原点极点）', exDoubleIntegrator: '双重积分器', exIdealDiff: '理想微分器（原点零点）', exRealDiff: '实际微分器（高通滤波器）',
            exUnderdamped: '欠阻尼二阶系统', exOverdamped: '过阻尼二阶系统', exPureOscillator: '纯振荡器（零阻尼）',
            exLeadNetwork: '实零点（超前网络）', exLagNetwork: '滞后网络', exLeadLagNetwork: '超前-滞后网络', exRHPZero: '右半平面零点（非最小相位）', exPadeDelay: '时间延迟（一阶帕德近似）',
            exPIController: 'PI控制器（比例-积分）', exPIDController: 'PID控制器（并联形式）',
            exNotchFilter: '陷波滤波器（带阻）',
            exMassSpringDamper: '质量-弹簧-阻尼系统（M=1, B=0.5, K=4）', exDCMotorSpeed: '直流电机：转速（一阶）', exDCMotorPosition: '直流电机：位置（含积分器）', exRCCircuit: 'RC电路（低通）', exInvertedPendulum: '倒立摆（不稳定系统）', exThermalProcess: '热过程（动态非常缓慢）', exElectromechanical: '通用机电系统（三阶）',
            historyBtn: '函数历史', examplesBtn: '推荐示例', historyEmpty: '没有已保存的函数',
            w1: '稳定性 & 鲁棒性', pm: '相位裕量', wc: '截止频率 (𝜔c)',
            gm: '增益裕量', w180: '相位交叉频率 (𝜔180)',
            clStab: '闭环稳定性', stable: '稳定', unstable: '不稳定',
            w2: '传递函数结构', staticGain: '静态增益 (𝘒₀)', sysType: '系统类型 (𝘨)',
            sysOrder: '系统阶次', zeros: '提取的零点', poles: '提取的极点',
            w3: '分析 & 滤波器', resPeak: '谐振峰值', slopeInit: '初始斜率',
            slopeFinal: '最终斜率', bandwidth: '带宽', filterBeh: '滤波器特性',
            titleMag: '幅频特性图 (dB)', titlePhase: '相频特性图',
            real: '实际', asymp: '渐近线', contrib: '贡献',
            lp: '低通', hp: '高通', bp: '带通', ap: '全通', notch: '陷波',
            absent: '无', nd: '未知',
            poleWord: '极点', zeroWord: '零点', ccWord: '共轭', originWord: '原点',
            temporalTitle: '时间响应研究', sigStep: '单位阶跃', sigImpulse: '冲激', sigRamp: '斜坡', sigSquare: '方波', sigSine: '正弦波', lblYss: '稳态值', lblEss: '稳态误差', lblTr: '上升时间', lblTs: '调节时间', lblOvershoot: '最大超调量', inputLbl: '输入', outputLbl: '输出',
            nyquistTitle: '奈奎斯特图', lblP: '不稳定极点 (P)', lblN: '环绕次数 (N)', lblZ: '闭环不稳定极点 (Z)', lblDist: '距(-1,0)最小距离',
            nyquistZoomHint: '滚动缩放，拖动平移。PDF 将保存您选择的最后缩放和平移状态。', nyquistResetZoom: '重置缩放',
            nicholsTitle: '尼科尔斯图', hallChart: '霍尔图', semilogChart: '半对数图'
        },
        pt: {
            title: 'Bem-vindo ao <span class="font-bold"> Easy Bode </span>',
            subtitle: 'A forma mais simples e rápida de estudar online a estabilidade e a resposta dos sistemas de controlo.',
            placeholder: 'Escreva sua função de transferência...',
            calcBtn: 'CALCULAR', unitHz: 'Unidade: Hz', unitRad: 'Unidade: rad/s',
            pdfBtn: 'Baixar PDF', previewLabel: 'Pré-visualização G(s):',
            syntaxError: '⚠️ Erro de sintaxe na fórmula!',
            olStabilityLabel: 'Estabilidade em Malha Aberta G(s)', olStable: 'ESTÁVEL', olUnstable: 'INSTÁVEL (polo instável)', olNonMinPhase: 'FASE NÃO MÍNIMA (zero instável)',
            navHome: 'Início', navTour: 'Tour', navDocs: 'Docs',
            catBasicPoles: 'Funções Básicas (Polos Reais)', catZerosIntDiff: 'Zeros, Integradores e Diferenciadores', cat2ndOrder: 'Sistemas de 2ª Ordem e Ressonâncias', catCompensators: 'Redes Compensadoras e Fase Não Mínima', catControllers: 'Controladores Padrão', catFilters: 'Filtros Especiais', catPhysicalModels: 'Modelos Físicos Clássicos',
            exSimplePole: 'Polo real simples', exPoleTimeConst: 'Polo real (constante de tempo)', exDoublePole: 'Polo real duplo', exTwoPoles: 'Dois polos reais distintos', ex3rdOrder: 'Sistema de 3ª ordem (três polos reais)', exWideSeparatedPoles: 'Polos em frequências muito distantes',
            exIntegrator: 'Integrador (polo na origem)', exDoubleIntegrator: 'Duplo integrador', exIdealDiff: 'Diferenciador ideal (zero na origem)', exRealDiff: 'Diferenciador real (filtro passa-alta)',
            exUnderdamped: '2ª ordem subamortecida', exOverdamped: '2ª ordem superamortecida', exPureOscillator: 'Oscilador puro (amortecimento nulo)',
            exLeadNetwork: 'Zero real (rede de avanço)', exLagNetwork: 'Rede de atraso (lag)', exLeadLagNetwork: 'Rede de avanço-atraso', exRHPZero: 'Zero no semiplano direito (fase não mínima)', exPadeDelay: 'Atraso de tempo (Padé de 1ª ordem)',
            exPIController: 'Controlador PI (Proporcional-Integral)', exPIDController: 'Controlador PID (forma paralela)',
            exNotchFilter: 'Filtro notch (rejeita-faixa)',
            exMassSpringDamper: 'Massa-Mola-Amortecedor (M=1, B=0.5, K=4)', exDCMotorSpeed: 'Motor DC: Velocidade (1ª ordem)', exDCMotorPosition: 'Motor DC: Posição (com integrador)', exRCCircuit: 'Circuito Elétrico RC (Passa-baixa)', exInvertedPendulum: 'Pêndulo Invertido (sistema instável)', exThermalProcess: 'Processo Térmico (dinâmica muito lenta)', exElectromechanical: 'Sistema Eletromecânico Genérico (3ª ordem)',
            historyBtn: 'Histórico de Funções', examplesBtn: 'Exemplos Sugeridos', historyEmpty: 'Nenhuma função salva',
            w1: 'Estabilidade & Robustez', pm: 'Margem de Fase', wc: 'Freq. Corte (𝜔c)',
            gm: 'Margem de Ganho', w180: 'Freq. Inversão (𝜔180)',
            clStab: 'Estabilidade Malha Fechada', stable: 'ESTÁVEL', unstable: 'INSTÁVEL',
            w2: 'Estrutura FdT', staticGain: 'Ganho Estático (𝘒₀)', sysType: 'Tipo Sistema (𝘨)',
            sysOrder: 'Ordem do Sistema', zeros: 'Zeros Extraídos', poles: 'Polos Extraídos',
            w3: 'Análise & Filtro', resPeak: 'Pico de Ressonância', slopeInit: 'Incl. Inic.',
            slopeFinal: 'Incl. Final', bandwidth: 'Largura de Banda', filterBeh: 'Comportamento Filtro',
            titleMag: 'Diagrama de Módulo (dB)', titlePhase: 'Diagrama de Fase',
            real: 'Real', asymp: 'Assint.', contrib: 'Contrib.',
            lp: 'Passa-Baixo', hp: 'Passa-Alto', bp: 'Passa-Banda', ap: 'Passa-Tudo', notch: 'Rejeição de Banda',
            absent: 'Ausente', nd: 'N/D',
            poleWord: 'Polo', zeroWord: 'Zero', ccWord: 'c.c.', originWord: 'origem',
            temporalTitle: 'Estudo da Resposta Temporal', sigStep: 'Degrau Unitário', sigImpulse: 'Impulso', sigRamp: 'Rampa', sigSquare: 'Onda Quadrada', sigSine: 'Onda Senoidal', lblYss: 'Valor de Regime', lblEss: 'Erro de Regime', lblTr: 'Tempo de Subida', lblTs: 'Tempo de Acomodação', lblOvershoot: 'Sobressinal Máx.', inputLbl: 'Entrada', outputLbl: 'Saída',
            nyquistTitle: 'Diagrama de Nyquist', lblP: 'Polos Instáveis (P)', lblN: 'Envolvimentos (N)', lblZ: 'Polos Instáveis M.F. (Z)', lblDist: 'Distância mín. de (-1,0)',
            nyquistZoomHint: 'Role para zoom, arraste para mover. O PDF salvará o último zoom e deslocamento escolhidos.', nyquistResetZoom: 'Redefinir Zoom',
            nicholsTitle: 'Diagrama de Nichols', hallChart: 'Carta de Hall', semilogChart: 'Papel Semilog'
        },
        ja: {
            title: '<span class="font-bold"> Easy Bode </span> へようこそ',
            subtitle: '制御システムの安定性と応答をオンラインで学ぶ、もっとも簡単で速い方法。',
            placeholder: '伝達関数を入力してください...',
            calcBtn: '計算', unitHz: '単位: Hz', unitRad: '単位: rad/s',
            pdfBtn: 'PDF ダウンロード', previewLabel: 'プレビュー G(s):',
            syntaxError: '⚠️ 数式の構文エラーです！',
            olStabilityLabel: '開ループ安定性 G(s)', olStable: '安定', olUnstable: '不安定（右半平面極）', olNonMinPhase: '非最小位相（右半平面零点）',
            navHome: 'ホーム', navTour: 'ツアー', navDocs: 'ドキュメント',
            catBasicPoles: '基本関数（実極）', catZerosIntDiff: '零点・積分器・微分器', cat2ndOrder: '2次系と共振', catCompensators: '補償回路と非最小位相', catControllers: '標準コントローラ', catFilters: '特殊フィルタ', catPhysicalModels: '古典的な物理モデル',
            exSimplePole: '単純な実極', exPoleTimeConst: '実極（時定数）', exDoublePole: '二重実極', exTwoPoles: '2つの異なる実極', ex3rdOrder: '3次系（3つの実極）', exWideSeparatedPoles: '大きく離れた周波数の極',
            exIntegrator: '積分器（原点の極）', exDoubleIntegrator: '二重積分器', exIdealDiff: '理想微分器（原点の零点）', exRealDiff: '実微分器（ハイパスフィルタ）',
            exUnderdamped: '減衰不足の2次系', exOverdamped: '過減衰の2次系', exPureOscillator: '純粋発振器（減衰なし）',
            exLeadNetwork: '実零点（進み補償回路）', exLagNetwork: '遅れ補償回路', exLeadLagNetwork: '進み-遅れ補償回路', exRHPZero: '右半平面零点（非最小位相）', exPadeDelay: '時間遅れ（1次パデ近似）',
            exPIController: 'PI制御器（比例積分）', exPIDController: 'PID制御器（並列形式）',
            exNotchFilter: 'ノッチフィルタ（帯域阻止）',
            exMassSpringDamper: '質量-バネ-ダンパー系（M=1, B=0.5, K=4）', exDCMotorSpeed: '直流モーター：速度（1次）', exDCMotorPosition: '直流モーター：位置（積分器あり）', exRCCircuit: 'RC回路（ローパス）', exInvertedPendulum: '倒立振子（不安定系）', exThermalProcess: '熱プロセス（非常に遅い動特性）', exElectromechanical: '汎用電気機械システム（3次）',
            historyBtn: '関数履歴', examplesBtn: 'おすすめの例', historyEmpty: '保存された関数はありません',
            w1: '安定性 & ロバスト性', pm: '位相余裕', wc: '交差周波数 (𝜔c)',
            gm: 'ゲイン余裕', w180: '位相交差周波数 (𝜔180)',
            clStab: '閉ループ安定性', stable: '安定', unstable: '不安定',
            w2: '伝達関数構造', staticGain: '静的ゲイン (𝘒₀)', sysType: 'システム型 (𝘨)',
            sysOrder: 'システム次数', zeros: '抽出された零点', poles: '抽出された極',
            w3: '解析 & フィルタ', resPeak: '共振ピーク', slopeInit: '初期傾き',
            slopeFinal: '最終傾き', bandwidth: '帯域幅', filterBeh: 'フィルタ特性',
            titleMag: '振幅線図 (dB)', titlePhase: '位相線図',
            real: '実際', asymp: '漸近線', contrib: '寄与',
            lp: '低域通過', hp: '高域通過', bp: '帯域通過', ap: 'オールパス', notch: 'ノッチ',
            absent: 'なし', nd: '不明',
            poleWord: '極', zeroWord: '零点', ccWord: '共役', originWord: '原点',
            temporalTitle: '時間応答の研究', sigStep: '単位ステップ', sigImpulse: 'インパルス', sigRamp: 'ランプ', sigSquare: '方形波', sigSine: '正弦波', lblYss: '定常値', lblEss: '定常偏差', lblTr: '立ち上がり時間', lblTs: '整定時間', lblOvershoot: '最大オーバーシュート', inputLbl: '入力', outputLbl: '出力',
            nyquistTitle: 'ナイキスト線図', lblP: '不安定極 (P)', lblN: '周回数 (N)', lblZ: '閉ループ不安定極 (Z)', lblDist: '(-1,0)からの最小距離',
            nyquistZoomHint: 'スクロールでズーム、ドラッグで移動。PDFには最後に選択したズームとパンが保存されます。', nyquistResetZoom: 'ズームをリセット',
            nicholsTitle: 'ニコルズ線図', hallChart: 'ホール線図', semilogChart: 'セミログ用紙'
        },
        ar: {
            title: 'مرحبًا بك في <span class="font-bold"> Easy Bode </span>',
            subtitle: 'الطريقة الأسهل والأسرع لدراسة استقرار واستجابة أنظمة التحكم عبر الإنترنت.',
            placeholder: 'اكتب دالة النقل الخاصة بك...',
            calcBtn: 'احسب', unitHz: 'وحدة: Hz', unitRad: 'وحدة: rad/s',
            pdfBtn: 'تحميل PDF', previewLabel: 'معاينة G(s):',
            syntaxError: '⚠️ خطأ في صياغة المعادلة!',
            olStabilityLabel: 'استقرار الحلقة المفتوحة G(s)', olStable: 'مستقر', olUnstable: 'غير مستقر (قطب غير مستقر)', olNonMinPhase: 'طور غير أدنى (صفر غير مستقر)',
            navHome: 'الرئيسية', navTour: 'جولة', navDocs: 'الوثائق',
            catBasicPoles: 'دوال أساسية (أقطاب حقيقية)', catZerosIntDiff: 'أصفار ومكاملات ومفاضلات', cat2ndOrder: 'أنظمة من الدرجة الثانية والرنين', catCompensators: 'شبكات التعويض والطور غير الأدنى', catControllers: 'وحدات تحكم قياسية', catFilters: 'مرشحات خاصة', catPhysicalModels: 'نماذج فيزيائية كلاسيكية',
            exSimplePole: 'قطب حقيقي بسيط', exPoleTimeConst: 'قطب حقيقي (ثابت زمني)', exDoublePole: 'قطب حقيقي مزدوج', exTwoPoles: 'قطبان حقيقيان متمايزان', ex3rdOrder: 'نظام من الدرجة الثالثة (ثلاثة أقطاب حقيقية)', exWideSeparatedPoles: 'أقطاب عند ترددات متباعدة جدًا',
            exIntegrator: 'مكامل (قطب عند الأصل)', exDoubleIntegrator: 'مكامل مزدوج', exIdealDiff: 'مفاضل مثالي (صفر عند الأصل)', exRealDiff: 'مفاضل حقيقي (مرشح تمرير عالٍ)',
            exUnderdamped: 'نظام من الدرجة الثانية ناقص التخميد', exOverdamped: 'نظام من الدرجة الثانية زائد التخميد', exPureOscillator: 'مذبذب نقي (تخميد صفري)',
            exLeadNetwork: 'صفر حقيقي (شبكة تقديم)', exLagNetwork: 'شبكة تأخير', exLeadLagNetwork: 'شبكة تقديم-تأخير', exRHPZero: 'صفر في نصف المستوى الأيمن (طور غير أدنى)', exPadeDelay: 'تأخير زمني (باديه من الدرجة الأولى)',
            exPIController: 'وحدة تحكم PI (تناسبي-تكاملي)', exPIDController: 'وحدة تحكم PID (الشكل المتوازي)',
            exNotchFilter: 'مرشح إخصاء (موقف نطاق)',
            exMassSpringDamper: 'كتلة-نابض-مخمد (M=1, B=0.5, K=4)', exDCMotorSpeed: 'محرك تيار مستمر: السرعة (الدرجة الأولى)', exDCMotorPosition: 'محرك تيار مستمر: الموضع (مع مكامل)', exRCCircuit: 'دائرة كهربائية RC (تمرير منخفض)', exInvertedPendulum: 'بندول مقلوب (نظام غير مستقر)', exThermalProcess: 'عملية حرارية (ديناميكية بطيئة جدًا)', exElectromechanical: 'نظام كهروميكانيكي عام (الدرجة الثالثة)',
            historyBtn: 'سجل الدوال', examplesBtn: 'أمثلة مقترحة', historyEmpty: 'لا توجد دوال محفوظة',
            w1: 'الاستقرار والمتانة', pm: 'هامش الطور', wc: 'تردد القطع (𝜔c)',
            gm: 'هامش الكسب', w180: 'تردد الطور 180° (𝜔180)',
            clStab: 'استقرار الحلقة المغلقة', stable: 'مستقر', unstable: 'غير مستقر',
            w2: 'بنية دالة النقل', staticGain: 'الكسب الساكن (𝘒₀)', sysType: 'نوع النظام (𝘨)',
            sysOrder: 'رتبة النظام', zeros: 'الأصفار المستخرجة', poles: 'الأقطاب المستخرجة',
            w3: 'التحليل والمرشح', resPeak: 'ذروة الرنين', slopeInit: 'الميل الابتدائي',
            slopeFinal: 'الميل النهائي', bandwidth: 'عرض النطاق', filterBeh: 'سلوك المرشح',
            titleMag: 'مخطط المقدار (dB)', titlePhase: 'مخطط الطور',
            real: 'حقيقي', asymp: 'مقارب', contrib: 'المساهمات',
            lp: 'تمرير منخفض', hp: 'تمرير مرتفع', bp: 'تمرير نطاق', ap: 'تمرير كامل', notch: 'رفض نطاق',
            absent: 'غائب', nd: 'غير محدد',
            poleWord: 'قطب', zeroWord: 'صفر', ccWord: 'مترافق', originWord: 'الأصل',
            temporalTitle: 'دراسة الاستجابة الزمنية', sigStep: 'خطوة الوحدة', sigImpulse: 'نبضة', sigRamp: 'منحدر', sigSquare: 'موجة مربعة', sigSine: 'موجة جيبية', lblYss: 'قيمة الاستقرار', lblEss: 'خطأ الاستقرار', lblTr: 'زمن الصعود', lblTs: 'زمن الاستقرار', lblOvershoot: 'أقصى تجاوز', inputLbl: 'الدخل', outputLbl: 'الخرج',
            nyquistTitle: 'مخطط نايكويست', lblP: 'أقطاب غير مستقرة (P)', lblN: 'عدد الإحاطات (N)', lblZ: 'أقطاب حلقة مغلقة غير مستقرة (Z)', lblDist: 'أدنى مسافة من (-1,0)',
            nyquistZoomHint: 'مرر للتكبير، اسحب للتحريك. سيحفظ ملف PDF آخر تكبير وتحريك اخترته.', nyquistResetZoom: 'إعادة ضبط التكبير',
            nicholsTitle: 'مخطط نيكولز', hallChart: 'مخطط هول', semilogChart: 'ورق شبه لوغاريتمي'
        },
        hi: {
            title: '<span class="font-bold"> Easy Bode </span> में आपका स्वागत है',
            subtitle: 'नियंत्रण प्रणालियों की स्थिरता और प्रतिक्रिया को ऑनलाइन अध्ययन करने का सबसे आसान और तेज़ तरीका।',
            placeholder: 'अपना ट्रांसफर फंक्शन लिखें...',
            calcBtn: 'गणना करें', unitHz: 'इकाई: Hz', unitRad: 'इकाई: rad/s',
            pdfBtn: 'PDF डाउनलोड', previewLabel: 'पूर्वावलोकन G(s):',
            syntaxError: '⚠️ सूत्र में वाक्यविन्यास त्रुटि!',
            olStabilityLabel: 'ओपन-लूप स्थिरता G(s)', olStable: 'स्थिर', olUnstable: 'अस्थिर (अस्थिर ध्रुव)', olNonMinPhase: 'गैर-न्यूनतम फेज़ (अस्थिर शून्य)',
            navHome: 'होम', navTour: 'टूर', navDocs: 'डॉक्स',
            catBasicPoles: 'मूल फ़ंक्शन (वास्तविक ध्रुव)', catZerosIntDiff: 'शून्य, इंटीग्रेटर और डिफरेंशिएटर', cat2ndOrder: 'द्वितीय क्रम प्रणाली और अनुनाद', catCompensators: 'क्षतिपूर्ति नेटवर्क और गैर-न्यूनतम फेज़', catControllers: 'मानक नियंत्रक', catFilters: 'विशेष फ़िल्टर', catPhysicalModels: 'शास्त्रीय भौतिक मॉडल',
            exSimplePole: 'सरल वास्तविक ध्रुव', exPoleTimeConst: 'वास्तविक ध्रुव (समय स्थिरांक)', exDoublePole: 'द्विक वास्तविक ध्रुव', exTwoPoles: 'दो भिन्न वास्तविक ध्रुव', ex3rdOrder: 'तृतीय क्रम प्रणाली (तीन वास्तविक ध्रुव)', exWideSeparatedPoles: 'व्यापक रूप से अलग आवृत्तियों पर ध्रुव',
            exIntegrator: 'इंटीग्रेटर (मूल बिंदु पर ध्रुव)', exDoubleIntegrator: 'द्विक इंटीग्रेटर', exIdealDiff: 'आदर्श डिफरेंशिएटर (मूल बिंदु पर शून्य)', exRealDiff: 'वास्तविक डिफरेंशिएटर (हाई-पास फ़िल्टर)',
            exUnderdamped: 'अल्प-अवमंदित द्वितीय क्रम', exOverdamped: 'अति-अवमंदित द्वितीय क्रम', exPureOscillator: 'शुद्ध ऑसिलेटर (शून्य अवमंदन)',
            exLeadNetwork: 'वास्तविक शून्य (लीड नेटवर्क)', exLagNetwork: 'लैग नेटवर्क', exLeadLagNetwork: 'लीड-लैग नेटवर्क', exRHPZero: 'दायां अर्ध-तल शून्य (गैर-न्यूनतम फेज़)', exPadeDelay: 'समय विलंब (प्रथम-क्रम पाडे)',
            exPIController: 'PI नियंत्रक (आनुपातिक-इंटीग्रल)', exPIDController: 'PID नियंत्रक (समानांतर रूप)',
            exNotchFilter: 'नॉच फ़िल्टर (बैंड-स्टॉप)',
            exMassSpringDamper: 'द्रव्यमान-स्प्रिंग-डैम्पर (M=1, B=0.5, K=4)', exDCMotorSpeed: 'डीसी मोटर: गति (प्रथम क्रम)', exDCMotorPosition: 'डीसी मोटर: स्थिति (इंटीग्रेटर सहित)', exRCCircuit: 'RC विद्युत परिपथ (लो-पास)', exInvertedPendulum: 'उल्टा पेंडुलम (अस्थिर प्रणाली)', exThermalProcess: 'थर्मल प्रक्रिया (बहुत धीमी गतिकी)', exElectromechanical: 'सामान्य इलेक्ट्रोमैकेनिकल प्रणाली (तृतीय क्रम)',
            historyBtn: 'फ़ंक्शन इतिहास', examplesBtn: 'सुझाए गए उदाहरण', historyEmpty: 'कोई सहेजा गया फ़ंक्शन नहीं',
            w1: 'स्थिरता और मजबूती', pm: 'फेज मार्जिन', wc: 'कटऑफ आवृत्ति (𝜔c)',
            gm: 'गेन मार्जिन', w180: 'फेज क्रॉसिंग आवृत्ति (𝜔180)',
            clStab: 'क्लोज्ड-लूप स्थिरता', stable: 'स्थिर', unstable: 'अस्थिर',
            w2: 'TF संरचना', staticGain: 'स्थैतिक लाभ (𝘒₀)', sysType: 'सिस्टम प्रकार (𝘨)',
            sysOrder: 'सिस्टम क्रम', zeros: 'निकाले गए शून्य', poles: 'निकाले गए ध्रुव',
            w3: 'विश्लेषण और फ़िल्टर', resPeak: 'अनुनाद शिखर', slopeInit: 'प्रारंभिक ढलान',
            slopeFinal: 'अंतिम ढलान', bandwidth: 'बैंडविड्थ', filterBeh: 'फ़िल्टर व्यवहार',
            titleMag: 'परिमाण आरेख (dB)', titlePhase: 'फेज आरेख',
            real: 'वास्तविक', asymp: 'स्पर्शोद्मुख', contrib: 'योगदान',
            lp: 'लो-पास', hp: 'हाई-पास', bp: 'बैंड-पास', ap: 'ऑल-पास', notch: 'नॉच',
            absent: 'अनुपस्थित', nd: 'अज्ञात',
            poleWord: 'ध्रुव', zeroWord: 'शून्य', ccWord: 'संयुग्मी', originWord: 'मूल',
            temporalTitle: 'समय अनुक्रिया अध्ययन', sigStep: 'यूनिट स्टेप', sigImpulse: 'इम्पल्स', sigRamp: 'रैंप', sigSquare: 'स्क्वायर वेव', sigSine: 'साइन वेव', lblYss: 'स्थिर अवस्था मान', lblEss: 'स्थिर अवस्था त्रुटि', lblTr: 'राइज़ टाइम', lblTs: 'सेटलिंग टाइम', lblOvershoot: 'अधिकतम ओवरशूट', inputLbl: 'इनपुट', outputLbl: 'आउटपुट',
            nyquistTitle: 'नाइक्विस्ट आरेख', lblP: 'अस्थिर ध्रुव (P)', lblN: 'परिक्रमाएँ (N)', lblZ: 'क्लोज्ड-लूप अस्थिर ध्रुव (Z)', lblDist: '(-1,0) से न्यूनतम दूरी',
            nyquistZoomHint: 'ज़ूम के लिए स्क्रॉल करें, खिसकाने के लिए खींचें। PDF आपके द्वारा चुने गए अंतिम ज़ूम और खिसकाव को सहेजेगा।', nyquistResetZoom: 'ज़ूम रीसेट करें',
            nicholsTitle: 'निकोल्स आरेख', hallChart: 'हॉल चार्ट', semilogChart: 'सेमीलॉग चार्ट'
        }
}

        // Returns the UI string for `key` in the current language (falls back to Italian, then to the raw key).
        function t(key) { return (LANG[currentLang] || LANG['it'])[key] || key; }

        let typingInterval;
        let isTyping = false;

        // Cycles the transfer-function input's placeholder text through a rotating set of example formulas.
        function startPlaceholderAnimation() 
        {
            const input = document.getElementById('tfInput');
            // Se l'utente ha già scritto qualcosa, non fare l'animazione
            if (input.value.trim() !== '') return; 
            
            clearInterval(typingInterval);
            const testoSito = t('placeholder');
            let i = 0;
            input.placeholder = '';
            isTyping = true;
            
            typingInterval = setInterval(() => {
                // Interrompe se l'utente inizia a scrivere durante l'animazione
                if (!isTyping || input.value !== '') {
                    clearInterval(typingInterval);
                    return;
                }
                input.placeholder += testoSito.charAt(i);
                i++;
                if (i >= testoSito.length) {
                    clearInterval(typingInterval);
                    isTyping = false;
                }
            }, 35); // 60ms per lettera
        }

        // Re-applies every static UI label/button/title for the currently selected language.
        function applyTranslations() 
        {
            // Chrome-only pages (Tour, Docs) don't have the calculator UI at
            // all — bail out early instead of throwing on the first missing
            // element. The shared navbar (language, dark mode, nav links) is
            // handled separately by applyNavTranslations(), which is safe
            // to call on every page.
            if (!document.getElementById('tfInput')) return;

            const L = LANG[currentLang] || LANG['it'];
            document.getElementById('ui-title').innerHTML = L.title;
            document.getElementById('ui-subtitle').textContent = L.subtitle;
            document.getElementById('ui-calc-btn').textContent = L.calcBtn;

            startPlaceholderAnimation();
            
            document.getElementById('lbl-unit-btn').textContent = currentUnit === 'Hz' ? L.unitHz : L.unitRad;
            document.getElementById('lbl-pdf-btn').textContent = L.pdfBtn;
            const prevLabel = document.getElementById('lbl-latex-preview');
            if (prevLabel) prevLabel.textContent = L.previewLabel;
            // Re-render the history chips (labels don't change with
            // language, but this keeps things tidy) and the Esempi
            // Suggeriti table only if it's currently open.
            renderHistoryChips();
            const exBackdrop = document.getElementById('examples-modal-backdrop');
            if (exBackdrop && exBackdrop.classList.contains('open')) renderExamplesModal();
            
            document.getElementById('lbl-w1-title').textContent = L.w1;
            document.getElementById('lbl-pm').textContent = L.pm;
            document.getElementById('lbl-wc').textContent = L.wc;
            document.getElementById('lbl-gm').textContent = L.gm;
            document.getElementById('lbl-w180').textContent = L.w180;
            document.getElementById('lbl-cl-stability').textContent = L.clStab;
            const olLbl = document.getElementById('lbl-ol-stability');
            if (olLbl) olLbl.textContent = L.olStabilityLabel;
            const exModalTitle = document.getElementById('lbl-examples-modal-title');
            if (exModalTitle) exModalTitle.textContent = L.examplesBtn;
            document.getElementById('lbl-w2-title').textContent = L.w2;
            document.getElementById('lbl-static-gain').textContent = L.staticGain;
            document.getElementById('lbl-sys-type').textContent = L.sysType;
            document.getElementById('lbl-sys-order').textContent = L.sysOrder;
            document.getElementById('lbl-extracted-zeros-title').textContent = L.zeros;
            document.getElementById('lbl-extracted-poles-title').textContent = L.poles;
            document.getElementById('lbl-w3-title').textContent = L.w3;
            document.getElementById('lbl-resonance-peak').textContent = L.resPeak;
            document.getElementById('lbl-slope-init').textContent = L.slopeInit;
            document.getElementById('lbl-slope-final').textContent = L.slopeFinal;
            document.getElementById('lbl-bandwidth').textContent = L.bandwidth;
            document.getElementById('lbl-filter-behavior').textContent = L.filterBeh;
            document.getElementById('title-mag').textContent = L.titleMag;
            document.getElementById('title-phase').textContent = L.titlePhase;
            ['mag', 'phase'].forEach(key => {
                document.getElementById(`mini-lbl-${key}-real`).textContent = L.real;
                document.getElementById(`mini-lbl-${key}-asymp`).textContent = L.asymp;
                document.getElementById(`mini-lbl-${key}-contrib`).textContent = L.contrib;
            });

            document.getElementById('lbl-temporal-title').textContent = L.temporalTitle;
            document.getElementById('lbl-overshoot').textContent = L.lblOvershoot;
            document.getElementById('lbl-yss').textContent = L.lblYss;
            document.getElementById('lbl-ess').textContent = L.lblEss;
            document.getElementById('lbl-tr').textContent = L.lblTr;
            document.getElementById('lbl-ts').textContent = L.lblTs;
            buildSignalMenu();
            updateSignalButtonDisplay();

            document.getElementById('lbl-nyquist-title').textContent = L.nyquistTitle;
            document.getElementById('lbl-nyquist-stability').textContent = L.clStab;
            document.getElementById('lbl-nyquist-p').textContent = L.lblP;
            document.getElementById('lbl-nyquist-n').textContent = L.lblN;
            document.getElementById('lbl-nyquist-z').textContent = L.lblZ;
            document.getElementById('lbl-nyquist-dist').textContent = L.lblDist;
            document.getElementById('lbl-nyquist-zoom-hint').textContent = L.nyquistZoomHint;
            document.getElementById('lbl-hall-toggle').textContent = L.hallChart;
            document.getElementById('lbl-semilog-mag').textContent = L.semilogChart;
            document.getElementById('lbl-semilog-phase').textContent = L.semilogChart;
            document.getElementById('lbl-nichols-title').textContent = L.nicholsTitle;
            document.getElementById('lbl-nichols-pm').textContent = L.pm;
            document.getElementById('lbl-nichols-gm').textContent = L.gm;
            document.getElementById('lbl-nichols-wc').textContent = L.wc;
            document.getElementById('lbl-nichols-w180').textContent = L.w180;
            document.getElementById('lbl-nyquist-reset').textContent = L.nyquistResetZoom;
        }
        

        // ── Flag SVGs ─────────────────────────────────────────────────────────
        const FLAGS = {
            it: `<svg class="flag-icon" viewBox="0 0 3 2"><rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ce2b37"/></svg>`,
            en: `<svg class="flag-icon" viewBox="0 0 50 30"><rect width="50" height="30" fill="#012169"/><path d="M0,0 L50,30 M0,30 L50,0" stroke="#fff" stroke-width="6"/><path d="M0,0 L50,30 M0,30 L50,0" stroke="#C8102E" stroke-width="2"/><path d="M25,0 L25,30 M0,15 L50,15" stroke="#fff" stroke-width="10"/><path d="M25,0 L25,30 M0,15 L50,15" stroke="#C8102E" stroke-width="6"/></svg>`,
            fr: `<svg class="flag-icon" viewBox="0 0 3 2"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>`,
            de: `<svg class="flag-icon" viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#D00"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>`,
            es: `<svg class="flag-icon" viewBox="0 0 3 2"><rect width="3" height="2" fill="#c60b1e"/><rect y="0.5" width="3" height="1" fill="#ffc400"/></svg>`,
            zh: `<svg class="flag-icon" viewBox="0 0 30 20"><rect width="30" height="20" fill="#DE2910"/><polygon points="5,2 6.2,5.8 10,5.8 7,8 8.2,12 5,10 1.8,12 3,8 0,5.8 3.8,5.8" fill="#FFDE00"/></svg>`,
            ja: `<svg class="flag-icon" viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#BC002D"/></svg>`,
            pt: `<svg class="flag-icon" viewBox="0 0 30 20"><rect width="9" height="20" fill="#006600"/><rect x="9" width="21" height="20" fill="#FF0000"/><circle cx="12" cy="10" r="5" fill="#FFD700" stroke="#006600" stroke-width="0.5"/></svg>`,
            ar: `<svg class="flag-icon" viewBox="0 0 30 20"><rect width="30" height="20" fill="#007A3D"/><rect y="7" width="30" height="6" fill="#fff"/><rect y="13" width="30" height="7" fill="#CE1126"/><rect x="0" width="10" height="20" fill="#000"/></svg>`,
            hi: `<svg class="flag-icon" viewBox="0 0 30 20"><rect width="30" height="7" fill="#FF9933"/><rect y="7" width="30" height="6" fill="#fff"/><rect y="13" width="30" height="7" fill="#138808"/><circle cx="15" cy="10" r="2.5" fill="none" stroke="#000080" stroke-width="0.8"/></svg>`
        };
        const LANG_NAMES = { it:'Italiano', en:'English', fr:'Français', de:'Deutsch', es:'Español', zh:'中文', ja:'日本語', pt:'Português', ar:'العربية', hi:'हिन्दी' };
        document.getElementById('langMenu').innerHTML = Object.keys(LANG_NAMES).map(code =>
            `<button onclick="selectLanguage('${code}')" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-800 dark:text-darktext hover:bg-stone-100 dark:hover:bg-gray-700 transition-all text-left">${FLAGS[code]}<span>${LANG_NAMES[code]}</span></button>`
        ).join('');
        document.getElementById('currentLangFlag').innerHTML = FLAGS.it;

        // Restore saved theme + language (if any), applied immediately at
        // script load time (this tag sits at the end of <body>, so the DOM
        // is already fully parsed) — before the shared navbar/translation
        // code below even runs, so Home/Tour/Docs always agree on theme
        // and language instead of resetting on every page navigation.
        const DARK_MODE_KEY = 'easybode_dark_mode';
        const LANG_KEY = 'easybode_lang';
        try {
            if (localStorage.getItem(DARK_MODE_KEY) === '1') {
                isDarkMode = true;
                document.documentElement.classList.add('dark');
                document.getElementById('theme-icon').setAttribute('data-lucide', 'sun');
            }
        } catch(e) {}
        try {
            const savedLang = localStorage.getItem(LANG_KEY);
            if (savedLang && LANG_NAMES[savedLang]) {
                currentLang = savedLang;
                document.getElementById('currentLangFlag').innerHTML = FLAGS[savedLang];
            }
        } catch(e) {}
        lucide.createIcons();
        updateLogos();

        // Translates the shared top navbar (page links). Safe to call on
        // every page — Home, Tour, Docs — since it only touches nav
        // elements that live in the shared header markup, never
        // calculator-specific ones.
        function applyNavTranslations() {
            const L = LANG[currentLang] || LANG['it'];
            const map = { 'nav-link-home': L.navHome, 'nav-link-tour': L.navTour, 'nav-link-docs': L.navDocs };
            Object.keys(map).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = map[id];
            });
        }

        function updateLogos() {
    document.querySelectorAll('#nav-logo, #footer-logo').forEach(img => {
        const src = isDarkMode ? img.dataset.dark : img.dataset.light;
        if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
}

        window.addEventListener('DOMContentLoaded', () => { applyNavTranslations(); updateLatexPreview(); applyTranslations(); restoreCurrentStudy(); });

        // Renders a live LaTeX preview of the transfer function as the user types it.
        // Timer that hides the LaTeX "nuvoletta" 3s after the last
        // keystroke; cleared/restarted on every new input event so it only
        // ever fires once typing has genuinely paused.
        let latexBubbleHideTimer = null;
        const LATEX_BUBBLE_HIDE_DELAY = 3000;

        function updateLatexPreview() {
            const inputEl = document.getElementById('tfInput');
            if (!inputEl) return; // chrome-only pages (Tour, Docs) have no calculator input
            const inputStr = inputEl.value;
            const previewDiv = document.getElementById('latexPreview');
            const bubble = document.getElementById('latexBubble');

            if (latexBubbleHideTimer) { clearTimeout(latexBubbleHideTimer); latexBubbleHideTimer = null; }

            if (!inputStr || inputStr.trim() === '') {
                // Nothing typed (or the field was cleared): the bubble has
                // nothing meaningful to show, so it stays/goes hidden.
                if (bubble) bubble.classList.remove('visible');
                return;
            }

            try {
                let parts = inputStr.split('/');
                let numStr = parts[0] || '1';
                let denStr = parts[1] || '1';
                // Strips '*' multiplication signs and simplifies 's^1' to 's' for a cleaner LaTeX display.
                function cleanFormula(str) { return str.trim().replace(/\*/g, '').replace(/s\^1/g, 's'); }
                let finalLatex = `$$G(s) = \\frac{${cleanFormula(numStr)}}{${cleanFormula(denStr)}}$$`;
                previewDiv.innerHTML = finalLatex;
                if (window.MathJax && MathJax.typesetPromise) { MathJax.typesetPromise([previewDiv]).catch(e => {}); }
            } catch(e) {}

            if (bubble) {
                bubble.classList.add('visible');
                pulseBubble();
                // Auto-hide 3s after this (the most recent) keystroke.
                latexBubbleHideTimer = setTimeout(() => {
                    bubble.classList.remove('visible');
                    latexBubbleHideTimer = null;
                }, LATEX_BUBBLE_HIDE_DELAY);
            }
        }

        // Restarts the LaTeX "nuvoletta" bubble's small pop animation every
        // time its content refreshes, giving a tactile live-update cue
        // while the user types — purely cosmetic, never affects layout.
        function pulseBubble() {
            const bubble = document.getElementById('latexBubble');
            if (!bubble) return;
            bubble.classList.remove('bubble-pulse');
            void bubble.offsetWidth; // force reflow so the animation can restart
            bubble.classList.add('bubble-pulse');
        }

        // Shows or hides the language-selector dropdown.
        function toggleLangMenu() { document.getElementById('langMenu').classList.toggle('hidden'); }

        // Switches the active language, updates the flag icon and all UI text, and recalculates the plot if one is already shown.
        function selectLanguage(lang) {
            document.getElementById('langMenu').classList.add('hidden');
            currentLang = lang;
            try { localStorage.setItem(LANG_KEY, lang); } catch(e) {}
            document.getElementById('currentLangFlag').innerHTML = FLAGS[lang] || FLAGS['it'];
            applyNavTranslations();
            applyTranslations();
            if (isInterfaceExpanded) generateBode();
        }



        // Switches between light and dark theme and swaps the moon/sun icon.
       function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    try { localStorage.setItem(DARK_MODE_KEY, isDarkMode ? '1' : '0'); } catch(e) {}
    document.documentElement.classList.toggle('dark');
    document.getElementById('theme-icon').setAttribute('data-lucide', isDarkMode ? 'sun' : 'moon');
    lucide.createIcons();
    updateLogos();
    if (isInterfaceExpanded) generateBode();
}
function toggleMobileMenu() {
            const backdrop = document.getElementById('mobile-menu-backdrop');
            const drawer = document.getElementById('mobile-menu-drawer');
            if (!backdrop || !drawer) return;
            backdrop.classList.remove('hidden');
            requestAnimationFrame(() => { backdrop.classList.add('open'); drawer.classList.add('open'); });
        }
        function closeMobileMenu() {
            const backdrop = document.getElementById('mobile-menu-backdrop');
            const drawer = document.getElementById('mobile-menu-drawer');
            if (!backdrop || !drawer) return;
            backdrop.classList.remove('open');
            drawer.classList.remove('open');
            setTimeout(() => backdrop.classList.add('hidden'), 250);
        }
        // Switches the frequency axis between Hz and rad/s and redraws the charts.
        function toggleUnits() {
            currentUnit = currentUnit === 'Hz' ? 'rads' : 'Hz';
            document.getElementById('lbl-unit-btn').innerText = currentUnit === 'Hz' ? t('unitHz') : t('unitRad');
            if (isInterfaceExpanded) generateBode();
        }

 // Toggles one of the three chart layers (real / asymptotic / contributions) on or off and updates the dock button's active styling.
 // toggleLayer (the old floating-dock toggle) was removed along with the
 // dock itself — layer visibility is now controlled per-chart via
 // toggleLocalLayer() and the mini-docks under each graph.

// Toggles one layer on just the magnitude or just the phase chart's own
// mini-dock, independent of the other chart and of the shared floating
// dock — rebuilds only that one chart's datasets, without recalculating.
function toggleLocalLayer(chartKey, layer) {
    const state = chartKey === 'mag' ? activeLayersMag : activeLayersPhase;
    state[layer] = !state[layer];
    updateMiniDockUI(chartKey);
    renderMiniContribPills(chartKey);
    rerenderSingleChart(chartKey);
}

// Syncs one mini-dock's button styling to its chart's current layer state.
function updateMiniDockUI(chartKey) {
    const state = chartKey === 'mag' ? activeLayersMag : activeLayersPhase;
    ['real', 'asymptotic', 'contributions'].forEach(l => {
        const btn = document.getElementById(`mini-btn-${chartKey}-${l}`);
        if (btn) btn.classList.toggle('mini-dock-active', !!state[l]);
    });
}

// Shows the individual pole/zero/K pills to the right of a mini-dock's
// "Contributi" button — same principle as the main floating dock's pill
// row, but independent per chart (desktop only; hidden via CSS on mobile).
function renderMiniContribPills(chartKey) {
    const container = document.getElementById(`mini-contrib-pills-${chartKey}`);
    if (!container) return;
    const layers = chartKey === 'mag' ? activeLayersMag : activeLayersPhase;
    const visibility = chartKey === 'mag' ? contributionVisibilityMag : contributionVisibilityPhase;
    if (!layers.contributions || !lastContributionCurves.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = lastContributionCurves.map(c => {
        const visible = visibility[c.id] !== false;
        return `<button type="button" onclick="toggleLocalContribution('${chartKey}','${c.id}')"
            class="text-[9px] font-semibold px-2 py-1 rounded-full border transition-all whitespace-nowrap cursor-pointer ${visible ? 'opacity-100' : 'opacity-30'}"
            style="border-color:${c.color}; color:${c.color};">${c.label}</button>`;
    }).join('');
}

// Toggles one contribution's visibility for just one chart's mini-dock.
function toggleLocalContribution(chartKey, id) {
    const visibility = chartKey === 'mag' ? contributionVisibilityMag : contributionVisibilityPhase;
    visibility[id] = !(visibility[id] !== false);
    renderMiniContribPills(chartKey);
    rerenderSingleChart(chartKey);
}

// Rebuilds just one chart's datasets from the cached data, without
// touching the other chart or re-running the full calculation.
function rerenderSingleChart(chartKey) {
    const isPhase = chartKey === 'phase';
    const layers = isPhase ? activeLayersPhase : activeLayersMag;
    const visibility = isPhase ? contributionVisibilityPhase : contributionVisibilityMag;
    const datasets = buildDatasetsForChart(lastMagData, lastPhaseData, lastAsympMagData, lastAsympPhaseData, lastContributionCurves, layers, isPhase, visibility);
    const chart = isPhase ? phaseChart : magChart;
    if (chart) { chart.data.datasets = datasets; chart.update(); }
}

        // Shows or hides a single pole/zero/gain contribution curve from the charts.
        function toggleContribution(id) {
            contributionVisibility[id] = !(contributionVisibility[id] !== false);
            renderContributionsMenu(lastContributionCurves);
            renderCharts(lastFreqDisplay, lastMagData, lastPhaseData, lastAsympMagData, lastAsympPhaseData, lastContributionCurves);
        }

  

     // Renders the row of colored pill buttons used to toggle individual pole/zero/gain contributions.
     // The floating dock and its global contributions popup were removed —
     // this is now a no-op kept only so any remaining call sites don't error;
     // per-chart contribution visibility lives in renderMiniContribPills().
     function renderContributionsMenu(curves) {
        const menu = document.getElementById('contributions-menu');
        if (!menu) return;
    const pills = document.getElementById('contrib-pills');
    if (!activeLayers.contributions || !curves || !curves.length) {
        menu.classList.add('hidden');
        return;
    }
    menu.classList.remove('hidden');
    pills.innerHTML = curves.map(c => {
        const visible = contributionVisibility[c.id] !== false;
        return `<button onclick="toggleContribution('${c.id}')"
            class="text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${visible ? 'opacity-100' : 'opacity-30'}"
            style="border-color:${c.color}; color:${c.color};">${c.label}</button>`;
    }).join('');
}

        // ── Core Calculation ──────────────────────────────────────────────────
        // Entry point for the CALCOLA button: parses the transfer function, runs the full analysis pipeline and displays the results.
        function handleCalculation() {
            document.getElementById('syntax-error-alert').classList.add('hidden');
            const expr = document.getElementById('tfInput').value;
            try {
                math.parse(expr);
                isInterfaceExpanded = true;
                document.getElementById('app-header').classList.remove('mt-30');
                document.getElementById('app-header').classList.add('mt-6');
                document.getElementById('dynamic-results-section').classList.remove('hidden');
                const footerEl = document.getElementById('site-footer-el');
                if (footerEl) footerEl.classList.remove('hidden');
                contributionVisibility = {};
                saveToHistory(expr);
                renderHistoryChips();
                saveCurrentStudy(expr);
                generateBode();
            } catch(e) {
                document.getElementById('syntax-error-alert').classList.remove('hidden');
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PERSISTENZA DELLO STUDIO (localStorage) — sopravvive al reload
        // ═══════════════════════════════════════════════════════════════════
        const STUDY_KEY = 'easybode_current_study';

        // Records the last successfully-calculated expression on its own,
        // separate from the (multi-entry) history — this is what gets
        // restored automatically on the next page load.
        function saveCurrentStudy(expr) {
            if (!expr || !expr.trim()) return;
            try { localStorage.setItem(STUDY_KEY, expr.trim()); } catch(e) {}
        }

        // On page load, if a previous study was saved, re-injects it into
        // the input and re-runs the full calculation (Bode, Nyquist,
        // Nichols, temporal response, stability badges) exactly as if the
        // user had just pressed CALCOLA — so reloading the page picks up
        // right where they left off instead of starting from a blank slate.
        function restoreCurrentStudy() {
            let saved = null;
            try { saved = localStorage.getItem(STUDY_KEY); } catch(e) {}
            if (!saved) return;
            const input = document.getElementById('tfInput');
            if (!input) return;
            input.value = saved;
            updateLatexPreview();
            handleCalculation();
        }

        // ═══════════════════════════════════════════════════════════════════
        // STORICO FUNZIONI (localStorage, mostrato come chip) & ESEMPI
        // SUGGERITI (dropdown agganciato alla freccia del pulsante CALCOLA)
        // ═══════════════════════════════════════════════════════════════════

        const HISTORY_KEY = 'easybode_tf_history';
        const HISTORY_MAX = 6;

        // Reads the saved history array from localStorage (newest first).
        // Fails safe to an empty array if storage is unavailable/corrupt.
        function loadHistory() {
            try {
                const raw = localStorage.getItem(HISTORY_KEY);
                const arr = raw ? JSON.parse(raw) : [];
                return Array.isArray(arr) ? arr : [];
            } catch(e) { return []; }
        }

        // Records a successfully-calculated expression at the front of the
        // history, de-duplicating and capping the list at HISTORY_MAX (6).
        function saveToHistory(expr) {
            if (!expr || !expr.trim()) return;
            expr = expr.trim();
            try {
                let hist = loadHistory().filter(e => e !== expr);
                hist.unshift(expr);
                hist = hist.slice(0, HISTORY_MAX);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
            } catch(e) {}
        }

        // Renders the last up-to-6 calculated expressions as small chips
        // directly below the input/CALCOLA row (replaces the old "Storico
        // Funzioni" dropdown button). Renders nothing when history is
        // empty — no placeholder needed for an always-visible inline row.
        function renderHistoryChips() {
            const container = document.getElementById('history-chips');
            if (!container) return;
            const hist = loadHistory();
            if (!hist.length) {
                container.innerHTML = '';
                return;
            }
            container.innerHTML = hist.map(expr => `
                <button type="button" onclick="applyExprToInput('${expr.replace(/'/g, "\\'")}')" class="history-chip" title="${expr}">
                    <i data-lucide="clock" class="w-3 h-3 opacity-60 shrink-0"></i>
                    <span class="font-mono">${expr}</span>
                </button>
            `).join('');
            lucide.createIcons();
        }

        // Curated list of 12 classic, all-STABLE transfer functions (every
        // pole strictly in the left half-plane — no pole at the origin or
        // in the right half-plane) covering the scenarios most useful for
        // teaching/reviewing Bode analysis: simple/double real poles,
        // widely/distinct-spaced real poles, a 3rd-order system, 2nd-order
        // under/over-damped systems, a real zero, a right-half-plane
        // (non-minimum-phase) zero — which doesn't affect stability, only
        // the pole does — a lag network and a 1st-order Padé phase-delay
        // approximation.
       // Curated, categorized transfer-function examples shown in the
        // full-screen "Esempi Suggeriti" table.
        // Each entry references translation KEYS (catKey/labelKey) instead
        // of hardcoded text — renderExamplesModal below resolves them via
        // t() at render time, so the table is fully translated in all 10
        // languages and updates automatically when the language changes.
        const TF_EXAMPLES = [
            // --- Basic Functions (Real Poles) ---
            { expr: '10/(s+1)',              labelKey: 'exSimplePole', catKey: 'catBasicPoles' },
            { expr: '5/(2*s+1)',             labelKey: 'exPoleTimeConst', catKey: 'catBasicPoles' },
            { expr: '1/(s+1)^2',             labelKey: 'exDoublePole', catKey: 'catBasicPoles' },
            { expr: '1/((s+1)*(s+8))',       labelKey: 'exTwoPoles', catKey: 'catBasicPoles' },
            { expr: '50/((s+1)*(s+3)*(s+12))', labelKey: 'ex3rdOrder', catKey: 'catBasicPoles' },
            { expr: '10/((s+0.2)*(s+50))',   labelKey: 'exWideSeparatedPoles', catKey: 'catBasicPoles' },

            // --- Zeros, Integrators & Differentiators ---
            { expr: '1/s',                   labelKey: 'exIntegrator', catKey: 'catZerosIntDiff' },
            { expr: '1/s^2',                 labelKey: 'exDoubleIntegrator', catKey: 'catZerosIntDiff' },
            { expr: 's',                     labelKey: 'exIdealDiff', catKey: 'catZerosIntDiff' },
            { expr: '10*s/(s+10)',           labelKey: 'exRealDiff', catKey: 'catZerosIntDiff' },

            // --- 2nd Order Systems & Resonances ---
            { expr: '25/(s^2+3*s+25)',       labelKey: 'exUnderdamped', catKey: 'cat2ndOrder' },
            { expr: '1/(s^2+5*s+6)',         labelKey: 'exOverdamped', catKey: 'cat2ndOrder' },
            { expr: '10/(s^2+100)',          labelKey: 'exPureOscillator', catKey: 'cat2ndOrder' },

            // --- Compensator Networks & Non-Minimum Phase ---
            { expr: '(s+10)/(s+1)',          labelKey: 'exLeadNetwork', catKey: 'catCompensators' },
            { expr: '(s+1)/(10*s+1)',        labelKey: 'exLagNetwork', catKey: 'catCompensators' },
            { expr: '10*((s+1)*(s+10))/((s+0.1)*(s+100))', labelKey: 'exLeadLagNetwork', catKey: 'catCompensators' },
            { expr: '(2-s)/(s+2)',           labelKey: 'exRHPZero', catKey: 'catCompensators' },
            { expr: '(1-0.5*s)/(1+0.5*s)',   labelKey: 'exPadeDelay', catKey: 'catCompensators' },

            // --- Standard Controllers ---
            { expr: '(s+2)/s',               labelKey: 'exPIController', catKey: 'catControllers' },
            { expr: '(s^2+3*s+2)/s',         labelKey: 'exPIDController', catKey: 'catControllers' },

            // --- Special Filters ---
            { expr: '(s^2+100)/(s^2+2*s+100)', labelKey: 'exNotchFilter', catKey: 'catFilters' },

            // --- Classic Physical Models ---
            { expr: '1/(s^2+0.5*s+4)',       labelKey: 'exMassSpringDamper', catKey: 'catPhysicalModels' },
            { expr: '10/(0.05*s+1)',         labelKey: 'exDCMotorSpeed', catKey: 'catPhysicalModels' },
            { expr: '10/(s*(0.05*s+1))',     labelKey: 'exDCMotorPosition', catKey: 'catPhysicalModels' },
            { expr: '1/(0.001*s+1)',         labelKey: 'exRCCircuit', catKey: 'catPhysicalModels' },
            { expr: '1/(s^2-9.81)',          labelKey: 'exInvertedPendulum', catKey: 'catPhysicalModels' },
            { expr: '2/(120*s+1)',           labelKey: 'exThermalProcess', catKey: 'catPhysicalModels' },
            { expr: '10/(s^3+6*s^2+11*s+6)', labelKey: 'exElectromechanical', catKey: 'catPhysicalModels' }
        ];

        // Groups TF_EXAMPLES by category (preserving first-seen order),
        // resolving catKey/labelKey through t() so the table always
        // reflects the currently-selected language, and renders them into
        // the full-screen modal table.
        function renderExamplesModal() {
            const body = document.getElementById('examples-modal-body');
            if (!body) return;
            const order = [], byCategory = {};
            TF_EXAMPLES.forEach(ex => {
                const cat = t(ex.catKey);
                if (!byCategory[cat]) { byCategory[cat] = []; order.push(cat); }
                byCategory[cat].push(ex);
            });
            body.innerHTML = order.map(cat => `
                <div class="examples-modal-category">${cat}</div>
                <div class="examples-modal-grid">
                    ${byCategory[cat].map(ex => `
                        <button type="button" onclick="applyExprToInput('${ex.expr.replace(/'/g, "\\'")}')" class="examples-modal-item">
                            <span class="examples-modal-item-expr">${ex.expr}</span>
                            <span class="examples-modal-item-label">${t(ex.labelKey)}</span>
                        </button>
                    `).join('')}
                </div>
            `).join('');
        }

        // Opens the full-screen "Esempi Suggeriti" table.
        function openExamplesModal() {
            renderExamplesModal();
            const backdrop = document.getElementById('examples-modal-backdrop');
            if (!backdrop) return;
            backdrop.classList.remove('hidden');
            requestAnimationFrame(() => backdrop.classList.add('open'));
        }

        // Closes it (also triggered by clicking the backdrop or picking an example).
        function closeExamplesModal() {
            const backdrop = document.getElementById('examples-modal-backdrop');
            if (!backdrop) return;
            backdrop.classList.remove('open');
            setTimeout(() => backdrop.classList.add('hidden'), 200);
        }

        // Injects the chosen expression (from a history chip or the Esempi
        // dropdown) directly into the CTA input, refreshes the live LaTeX
        // bubble, and closes the Esempi dropdown if it was open.
        function applyExprToInput(expr) {
            const input = document.getElementById('tfInput');
            input.value = expr;
            updateLatexPreview();
            input.focus();
           closeExamplesModal();
        }



        // ── TF Math Engine ────────────────────────────────────────────────────
        // Extracts the real part of a value that may be a plain number or a mathjs complex number.
        function toReal(v) {
            if (v === null || v === undefined) return 0;
            if (typeof v === 'object' && 're' in v) return v.re;
            return v;
        }
        // Returns the magnitude (absolute value) of a real or complex number.
        function cMag(v) {
            if (typeof v === 'object' && 're' in v) return Math.hypot(v.re, v.im);
            return Math.abs(v);
        }

        // Splits a transfer function string into its numerator/denominator substrings around the '/'.
        function splitTF(exprStr) {
            let idx = exprStr.indexOf('/');
            if (idx === -1) return { numStr: exprStr, denStr: '1' };
            let numStr = exprStr.slice(0, idx).trim();
            let denStr = exprStr.slice(idx + 1).trim();
            // Removes one layer of enclosing parentheses from a string, if present.
            function stripParens(s) {
                s = s.trim();
                if (s.startsWith('(') && s.endsWith(')')) {
                    let depth = 0, ok = true;
                    for (let i = 0; i < s.length; i++) {
                        if (s[i] === '(') depth++;
                        else if (s[i] === ')') { depth--; if (depth === 0 && i !== s.length - 1) { ok = false; break; } }
                    }
                    if (ok) return s.slice(1, -1);
                }
                return s;
            }
            return { numStr: stripParens(numStr) || '1', denStr: stripParens(denStr) || '1' };
        }

        // Evaluates the expression at the (maxDeg+1)-th roots of unity and takes the inverse DFT to recover the polynomial's coefficients exactly (to machine precision) for any degree <= maxDeg, no matter how widely the coefficients' magnitudes vary. Replaces an earlier Vandermonde-fit approach that silently lost high-degree poles/zeros (and misreported system order) once degree or coefficient scale grew.
        function extractPolyCoefficients(exprStr) {
            const maxDeg = 14, N = maxDeg + 1;
            let code;
            try { code = math.compile(exprStr); } catch(e) { return [1]; }
            const samples = [];
            for (let k = 0; k < N; k++) {
                const theta = 2 * Math.PI * k / N;
                const zk = math.complex(Math.cos(theta), Math.sin(theta));
                let val;
                try { val = code.evaluate({ s: zk }); } catch(e) { val = math.complex(0, 0); }
                samples.push(typeof val === 'number' ? math.complex(val, 0) : val);
            }
            const maxSample = Math.max(...samples.map(cMag), 1e-9);
            const coeffs = [];
            for (let j = 0; j < N; j++) {
                let sum = math.complex(0, 0);
                for (let k = 0; k < N; k++) {
                    const theta = -2 * Math.PI * j * k / N;
                    sum = math.add(sum, math.multiply(samples[k], math.complex(Math.cos(theta), Math.sin(theta))));
                }
                coeffs.push(math.divide(sum, N));
            }
            let c = coeffs.map(v => toReal(v));
            // Noise floor scales with the sampled values' magnitude (where
            // floating-point error actually accumulates), not with the
            // coefficients' own max — using the latter wrongly discarded a
            // genuinely real but comparatively small leading coefficient
            // whenever other coefficients (e.g. the constant term) were much
            // larger, silently under-reporting the polynomial's degree and
            // therefore losing poles/zeros from the analysis.
            const noiseFloor = maxSample * 1e-9;
            let deg = c.length - 1;
            while (deg > 0 && Math.abs(c[deg]) < noiseFloor) deg--;
            return c.slice(0, deg + 1);
        }

        // Counts how many leading (lowest-order) coefficients are numerically zero — i.e. the multiplicity of a pole/zero sitting exactly at the origin.
        function originMultiplicity(c) {
            let maxAbs = Math.max(...c.map(v => Math.abs(v)), 1e-9), g = 0;
            while (g < c.length - 1 && Math.abs(c[g]) < maxAbs * 1e-6) g++;
            return g;
        }

        // Finds all roots of a polynomial (given ascending-order coefficients) using the iterative Durand-Kerner method.
        function polyRoots(coeffsAsc) {
            let c = coeffsAsc.slice();
            let maxAbs = Math.max(...c.map(v => Math.abs(v)), 1e-9);
            while (c.length > 1 && Math.abs(c[c.length - 1]) < maxAbs * 1e-7) c.pop();
            const n = c.length - 1;
            if (n <= 0) return [];
            const lead = c[n];
            const a = c.map(v => v / lead);
            let roots = [];
            for (let i = 0; i < n; i++) {
                let ang = (2 * Math.PI * i) / n + 0.4 + i * 0.05;
                roots.push(math.complex(0.4 * Math.cos(ang), 0.4 * Math.sin(ang)));
            }
            // Evaluates a polynomial (ascending-order coefficients) at a given complex point.
            function evalP(x) {
                let res = math.complex(a[n], 0);
                for (let k = n - 1; k >= 0; k--) res = math.add(math.multiply(res, x), math.complex(a[k], 0));
                return res;
            }
            for (let iter = 0; iter < 300; iter++) {
                let newRoots = roots.slice(), maxDelta = 0;
                for (let i = 0; i < n; i++) {
                    let num = evalP(roots[i]);
                    let den = math.complex(1, 0);
                    for (let j = 0; j < n; j++) { if (j !== i) den = math.multiply(den, math.subtract(roots[i], roots[j])); }
                    if (cMag(den) < 1e-14) continue;
                    let delta = math.divide(num, den);
                    newRoots[i] = math.subtract(roots[i], delta);
                    maxDelta = Math.max(maxDelta, cMag(delta));
                }
                roots = newRoots;
                if (maxDelta < 1e-9) break;
            }
            return roots;
        }

        // Groups raw polynomial roots into real roots or complex-conjugate pairs, tagging each with its natural frequency and order for the Bode contribution builder.
        function groupRoots(roots) {
            let groups = [], used = new Array(roots.length).fill(false);
            for (let i = 0; i < roots.length; i++) {
                if (used[i]) continue;
                let r = roots[i];
                if (Math.abs(r.im) < 1e-4) {
                    groups.push({ freq: Math.abs(r.re) || 1e-6, sigma: r.re, order: 1, complex: false, roots: [r] });
                    used[i] = true;
                } else {
                    let pairIdx = -1;
                    for (let j = i + 1; j < roots.length; j++) {
                        if (!used[j] && Math.abs(roots[j].re - r.re) < 1e-3 && Math.abs(roots[j].im + r.im) < 1e-3) { pairIdx = j; break; }
                    }
                    if (pairIdx >= 0) used[pairIdx] = true;
                    used[i] = true;
                    groups.push({ freq: cMag(r), sigma: r.re, omega: Math.abs(r.im), order: 2, complex: true, roots: [r] });
                }
            }
            return groups;
        }

        // Formats a list of poles or zeros into the human-readable string shown in the 'Extracted poles/zeros' card.
        function formatRootsList(roots, gOrigin, letter) {
            let parts = [];
            if (gOrigin > 0) parts.push(`s = 0 (×${gOrigin})`);
            let used = new Array(roots.length).fill(false);
            let counter = 1;
            for (let i = 0; i < roots.length; i++) {
                if (used[i]) continue;
                let r = roots[i];
                if (Math.abs(r.im) < 1e-4) {
                    parts.push(`${letter}${counter} = ${r.re.toFixed(3)}`);
                    used[i] = true; counter++;
                } else {
                    let pairIdx = -1;
                    for (let j = i + 1; j < roots.length; j++) {
                        if (!used[j] && Math.abs(roots[j].re - r.re) < 1e-3 && Math.abs(roots[j].im + r.im) < 1e-3) { pairIdx = j; break; }
                    }
                    if (pairIdx >= 0) used[pairIdx] = true;
                    used[i] = true;
                    parts.push(`${letter}${counter},${counter+1} = ${r.re.toFixed(3)} ± j${Math.abs(r.im).toFixed(3)}`);
                    counter += 2;
                }
            }
            return parts.length ? parts.join(' &nbsp;&nbsp; ') : '--';
        }

        // Runs the full analysis of a transfer function string: polynomial coefficients, poles, zeros, system order, relative degree and static gain K0.
        function computeTFAnalysis(exprStr) {
            const { numStr, denStr } = splitTF(exprStr);
            const numC = extractPolyCoefficients(numStr);
            const denC = extractPolyCoefficients(denStr);
            let gPole = originMultiplicity(denC);
            let gZero = originMultiplicity(numC);
            let denReduced = denC.slice(gPole);
            let numReduced = numC.slice(gZero);
            let poles = polyRoots(denReduced);
            let zeros = polyRoots(numReduced);
            let order = denC.length - 1;
            let relDeg = (denC.length - 1) - (numC.length - 1);
            let K0 = NaN;
            try {
                let code = math.compile(exprStr);
                let smallS = 1e-4;
                K0 = toReal(code.evaluate({ s: smallS })) * Math.pow(smallS, gPole - gZero);
            } catch(e) {}
            return { numC, denC, poles, zeros, gPole, gZero, order, relDeg, K0 };
        }

// Classifies the OPEN-LOOP transfer function G(s) itself (as typed),
// based purely on where its own poles/zeros sit — a different question
// from closedLoopStability below (which answers whether G(s) wrapped in
// unity feedback is stable; a system can be open-loop unstable and still
// become closed-loop stable, that's the whole point of feedback control).
function openLoopClassification(analysis) {
    const hasRHPPole = analysis.poles.some(p => toReal(p) > 1e-6);
    const hasRHPZero = analysis.zeros.some(z => toReal(z) > 1e-6);
    if (hasRHPPole) return { text: t('olUnstable'), cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' };
    if (hasRHPZero) return { text: t('olNonMinPhase'), cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' };
    return { text: t('olStable'), cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' };
}

        // True closed-loop (unity feedback) stability: find the roots of the
        // characteristic polynomial num(s) + den(s) directly, rather than
        // inferring stability only from the open-loop phase/gain margins.
        // The margin-based check silently defaults to "stable" whenever the
        // open-loop magnitude never crosses 0dB — which is exactly what
        // happens for plants with an unstable (right-half-plane) open-loop
        // pole, so it was masking real instability.
        // Determines true closed-loop (unity feedback) stability by finding the roots of the characteristic polynomial num(s)+den(s) — more robust than inferring stability from phase/gain margins alone.
        function closedLoopStability(analysis) {
            const num = analysis.numC || [], den = analysis.denC || [];
            const len = Math.max(num.length, den.length);
            const charPoly = [];
            for (let i = 0; i < len; i++) charPoly.push((den[i] || 0) + (num[i] || 0));
            const clRoots = polyRoots(charPoly);
            if (!clRoots.length) return true;
            const eps = 1e-6;
            return clRoots.every(r => toReal(r) < -eps);
        }

        // ── Asymptotic curve (total) ───────────────────────────────────────────
        // Builds the overall asymptotic (straight-line) magnitude approximation of the Bode plot from the system's poles/zeros/gain.
        function buildAsymptoticCurve(poleGroups, zeroGroups, gPole, gZero, freqRad, startLevelDb) {
            let corners = [];
            poleGroups.forEach(g => corners.push({ freq: g.freq, delta: -20 * g.order }));
            zeroGroups.forEach(g => corners.push({ freq: g.freq, delta: 20 * g.order }));
            corners.sort((a, b) => a.freq - b.freq);
            let slope = -20 * gPole + 20 * gZero;
            let currentLevel = startLevelDb;
            let cornerIdx = 0, prevFreq = freqRad[0];
            let result = [];
            for (let i = 0; i < freqRad.length; i++) {
                let f = freqRad[i];
                while (cornerIdx < corners.length && corners[cornerIdx].freq <= f && corners[cornerIdx].freq >= prevFreq) {
                    let cf = corners[cornerIdx].freq;
                    if (cf > prevFreq) currentLevel += slope * Math.log10(cf / prevFreq);
                    slope += corners[cornerIdx].delta;
                    prevFreq = cf;
                    cornerIdx++;
                }
                if (f > prevFreq) currentLevel += slope * Math.log10(f / prevFreq);
                prevFreq = f;
                result.push(currentLevel);
            }
            return result;
        }

        // Asymptotic phase (total): step from 0 to ±90° per real root, ±180° per complex pair
        // Builds the overall asymptotic phase approximation of the Bode plot.
        function buildAsymptoticPhase(poleGroups, zeroGroups, freqRad, startPhase) {
            // Anchored to the TRUE (real, continuously-unwrapped) phase at
            // the first sampled frequency — the same "anchor to the real
            // curve" trick already used for the magnitude asymptote's
            // startLevel, extended to phase. This automatically includes
            // any origin pole/zero contribution AND the correct sign for
            // any unstable pole or non-minimum-phase (right-half-plane)
            // zero, with no separate reasoning needed about the sign of
            // the static gain — whatever the true curve's own value is at
            // that first point, the asymptote starts from exactly the same
            // place, then evolves via the standard bounded, corner-by-corner
            // transitions below. Previously this baseline was computed
            // purely analytically and silently ignored instability
            // entirely, which — since the phase axis auto-scales to
            // whatever is plotted — could blow out the Y range and
            // visually squash/shift the correct real curve out of view.
            let initPhase = (typeof startPhase === 'number' && isFinite(startPhase)) ? startPhase : 0;

            return freqRad.map(w => {
                let phase = initPhase;
                poleGroups.forEach(g => {
                    // A right-half-plane (unstable) pole's transition runs
                    // in the opposite direction from a stable one's.
                    const flip = g.sigma > 0 ? -1 : 1;
                    let contribution = flip * (-90 * g.order);
                    let wLow = g.freq / 10, wHigh = g.freq * 10;
                    if (w <= wLow) phase += 0;
                    else if (w >= wHigh) phase += contribution;
                    else phase += contribution * (Math.log10(w) - Math.log10(wLow)) / (Math.log10(wHigh) - Math.log10(wLow));
                });
                zeroGroups.forEach(g => {
                    // Same idea for a right-half-plane (non-minimum-phase) zero.
                    const flip = g.sigma > 0 ? -1 : 1;
                    let contribution = flip * (90 * g.order);
                    let wLow = g.freq / 10, wHigh = g.freq * 10;
                    if (w <= wLow) phase += 0;
                    else if (w >= wHigh) phase += contribution;
                    else phase += contribution * (Math.log10(w) - Math.log10(wLow)) / (Math.log10(wHigh) - Math.log10(wLow));
                });
                return phase;
            });
        }

        // Builds one real + asymptotic magnitude/phase curve for every individual pole, zero, static gain and origin pole/zero — used by the 'contributions' visualization layer.
        // Vivid color families (not pastel) for pole/zero contributions,
        // cycling through several shades so multiple poles (or zeros) stay
        // visually distinct: poles run yellow -> ochre -> orange -> red,
        // zeros run sky-blue -> blue -> violet -> purple.
        const POLE_COLORS = ['#facc15', '#f59e0b', '#f97316', '#dc2626'];
        const ZERO_COLORS = ['#38bdf8', '#2563eb', '#7c3aed', '#c026d3'];

        function buildContributionCurves(analysis, freqRad) {
            const curves = [];

            if (isFinite(analysis.K0) && analysis.K0 !== 0) {
                const kDb = 20 * Math.log10(Math.abs(analysis.K0));
                const kPhase = analysis.K0 < 0 ? -180 : 0;
                const kArr = freqRad.map(() => kDb), kPh = freqRad.map(() => kPhase);
                curves.push({ id: 'gain-k', label: `K = ${analysis.K0.toFixed(3)}`, dataMag: kArr, dataPhase: kPh, dataMagAsymp: kArr, dataPhaseAsymp: kPh, color: '#eab308' });
            }

            // First-order (or 2nd-order complex) pole response; a zero's
            // response is exactly the reciprocal (mag inverted, phase negated).
            // Computes the complex frequency response of a single first-order (real) or second-order (complex-conjugate) pole contribution at frequency w.
            function poleVal(g, w) {
                const s = math.complex(0, w);
                if (!g.complex) {
                    // Normalized to unit DC gain, exactly like the original
                    // wn/(s+wn) — but now the denominator's sign flips for a
                    // right-half-plane (unstable) root, so this curve
                    // correctly shows an increasing (not decreasing) phase.
                    // The overall ±180° sign of an unstable root is already
                    // carried entirely by the separate gain/K contribution
                    // curve (kPhase, below) — duplicating it here would
                    // double-count it, which is what the very first version
                    // of this fix got wrong.
                    const p = Math.abs(g.sigma) || 1e-6;
                    const signFlip = g.sigma > 0 ? -1 : 1;
                    return math.divide(math.complex(p, 0), math.add(math.complex(p, 0), math.multiply(s, math.complex(signFlip, 0))));
                }
                // Signed damping: zeta = -sigma/wn, so an unstable
                // (right-half-plane) pair (sigma > 0) correctly comes out
                // negative here, matching the standard s^2+2*zeta*wn*s+wn^2
                // convention where poles sit at -zeta*wn ± j...
                const wn = g.freq, zeta = -g.sigma / wn, wn2 = wn * wn;
                const denom = math.add(math.add(math.multiply(s, s), math.multiply(math.complex(2 * zeta * wn, 0), s)), math.complex(wn2, 0));
                return math.divide(math.complex(wn2, 0), denom);
            }
            // Builds a full contribution-curve object (real + asymptotic, magnitude + phase, label, color) for one grouped pole or zero. A zero's response is the exact reciprocal of the matching pole's.
            function buildRootCurve(g, isZero, idx) {
                const dataMag = [], dataPhase = [];
                freqRad.forEach(w => {
                    let val = poleVal(g, w);
                    if (isZero) val = math.divide(math.complex(1, 0), val);
                    const polar = val.toPolar();
                    dataMag.push(20 * Math.log10(polar.r));
                    dataPhase.push(polar.phi * (180 / Math.PI));
                });
                const magSign = isZero ? 1 : -1;
                const dataMagAsymp = freqRad.map(w => w <= g.freq ? 0 : magSign * 20 * g.order * Math.log10(w / g.freq));
                // Same right-half-plane correction as poleVal/buildAsymptoticPhase:
                // an unstable pole or a non-minimum-phase zero transitions in
                // the opposite direction from the stable/minimum-phase case.
                // No baseline here either — see the note in poleVal above.
                const isRHP = g.sigma > 0;
                const phaseSign = (isZero ? 1 : -1) * (isRHP ? -1 : 1);
                const dataPhaseAsymp = freqRad.map(w => {
                    const wLow = g.freq / 10, wHigh = g.freq * 10;
                    if (w <= wLow) return 0;
                    if (w >= wHigh) return phaseSign * 90 * g.order;
                    return phaseSign * 90 * g.order * (Math.log10(w) - Math.log10(wLow)) / 2;
                });
                const palette = isZero ? ZERO_COLORS : POLE_COLORS;
                return {
                    id: `${isZero ? 'zero' : 'pole'}-${idx}`,
                    label: `${isZero ? t('zeroWord') : t('poleWord')}${g.complex ? ' ' + t('ccWord') : ''} ≈ ${g.freq.toPrecision(3)} rad/s`,
                    dataMag, dataPhase, dataMagAsymp, dataPhaseAsymp,
                    color: palette[(idx - 1) % palette.length]
                };
            }
            groupRoots(analysis.poles).forEach((g, i) => curves.push(buildRootCurve(g, false, i + 1)));
            groupRoots(analysis.zeros).forEach((g, i) => curves.push(buildRootCurve(g, true, i + 1)));

            if (analysis.gPole > 0) {
                const dataMag = freqRad.map(w => -20 * analysis.gPole * Math.log10(w));
                const dataPhase = freqRad.map(() => -90 * analysis.gPole);
                curves.push({ id: 'pole-origin', label: `${t('poleWord')} ${t('originWord')} ×${analysis.gPole}`, dataMag, dataPhase, dataMagAsymp: dataMag, dataPhaseAsymp: dataPhase, color: POLE_COLORS[POLE_COLORS.length - 1] });
            }
            if (analysis.gZero > 0) {
                const dataMag = freqRad.map(w => 20 * analysis.gZero * Math.log10(w));
                const dataPhase = freqRad.map(() => 90 * analysis.gZero);
                curves.push({ id: 'zero-origin', label: `${t('zeroWord')} ${t('originWord')} ×${analysis.gZero}`, dataMag, dataPhase, dataMagAsymp: dataMag, dataPhaseAsymp: dataPhase, color: ZERO_COLORS[ZERO_COLORS.length - 1] });
            }
            return curves;
        }

        // ── Parameter panel ───────────────────────────────────────────────────
        // Finds where a sampled curve crosses a target value and returns the interpolated crossing point (fractional index).
        function findCrossing(xArr, yArr, target) {
            for (let i = 0; i < yArr.length - 1; i++) {
                if (yArr[i] === null || yArr[i + 1] === null) continue;
                if ((yArr[i] - target) * (yArr[i + 1] - target) <= 0 && yArr[i] !== yArr[i + 1]) {
                    let tt = (target - yArr[i]) / (yArr[i + 1] - yArr[i]);
                    return { index: i, t: tt };
                }
            }
            return null;
        }
        // Linearly interpolates a value in an array at a fractional index.
        function interpAt(arr, index, t) {
            if (arr[index] === null || arr[index + 1] === null) return null;
            return arr[index] + t * (arr[index + 1] - arr[index]);
        }
        // Linearly interpolates a frequency value at a fractional index.
        function freqAt(freqArr, index, t) {
            let a = Math.log10(freqArr[index]), b = Math.log10(freqArr[index + 1]);
            return Math.pow(10, a + t * (b - a));
        }

        // Computes and displays every derived quantity shown in the 3 result cards: static gain, system type/order, phase/gain margins, crossover frequencies, closed-loop stability, resonance peak, slopes, bandwidth and filter type.
        function updateParameterPanel(analysis, freqRad, freqDisplay, magData, phaseData) {
            const unitLabel = currentUnit === 'Hz' ? 'Hz' : 'rad/s';

            document.getElementById('val-static-gain').innerText = isFinite(analysis.K0) ? analysis.K0.toFixed(3) : '--';
            document.getElementById('val-sys-type').innerText = String(analysis.gPole);
            document.getElementById('val-sys-order').innerText = String(analysis.order);
            document.getElementById('val-extracted-zeros').innerHTML = formatRootsList(analysis.zeros, analysis.gZero, 'z');
            document.getElementById('val-extracted-poles').innerHTML = formatRootsList(analysis.poles, analysis.gPole, 'p');

            let wcCross = findCrossing(freqRad, magData, 0);
            let pmValue = Infinity;
            if (wcCross) {
                let phAtWc = interpAt(phaseData, wcCross.index, wcCross.t);
                let wAtWc = freqAt(freqRad, wcCross.index, wcCross.t);
                pmValue = 180 + phAtWc;
                document.getElementById('val-pm').innerText = pmValue.toFixed(1) + '°';
                document.getElementById('val-wc').innerText = (currentUnit === 'Hz' ? wAtWc / (2 * Math.PI) : wAtWc).toPrecision(3) + ' ' + unitLabel;
                lastWc = wAtWc; // rad/s, used as the default sine input frequency in the temporal response study
            } else {
                document.getElementById('val-pm').innerText = '∞°';
                document.getElementById('val-wc').innerText = '--';
                lastWc = null;
            }

            let w180Cross = findCrossing(freqRad, phaseData, -180);
            let gmValue = Infinity;
            if (w180Cross) {
                let magAtW180 = interpAt(magData, w180Cross.index, w180Cross.t);
                let wAtW180 = freqAt(freqRad, w180Cross.index, w180Cross.t);
                gmValue = -magAtW180;
                document.getElementById('val-gm').innerText = gmValue.toFixed(1) + ' dB';
                document.getElementById('val-w180').innerText = (currentUnit === 'Hz' ? wAtW180 / (2 * Math.PI) : wAtW180).toPrecision(3) + ' ' + unitLabel;
            } else {
                document.getElementById('val-gm').innerText = '∞ dB';
                document.getElementById('val-w180').innerText = '--';
            }

            let stable = closedLoopStability(analysis);
            let clEl = document.getElementById('val-cl-stability');
            clEl.innerText = stable ? t('stable') : t('unstable');
            clEl.className = 'text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-md inline-block mt-1 ' + (stable
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400');
            let olInfo = openLoopClassification(analysis);
            let olEl = document.getElementById('val-ol-stability');
            if (olEl) { olEl.innerText = olInfo.text; olEl.className = 'text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-md inline-block mt-1 ' + olInfo.cls; }
            let slopeInit = -20 * analysis.gPole + 20 * analysis.gZero;
            let slopeFinal = -20 * analysis.relDeg;
            document.getElementById('val-slope-init').innerText = (slopeInit >= 0 ? '+' : '') + slopeInit + ' dB/dec';
            document.getElementById('val-slope-final').innerText = (slopeFinal >= 0 ? '+' : '') + slopeFinal + ' dB/dec';

            let validMag = magData.filter(v => v !== null);
            let dcLevel = magData[0] !== null ? magData[0] : validMag[0];
            let peak = Math.max(...validMag);
            let peakDelta = peak - dcLevel;
            document.getElementById('val-resonance-peak').innerText = peakDelta > 0.5 ? '+' + peakDelta.toFixed(2) + ' dB' : t('absent');

            let bwIdx = findCrossing(freqRad, magData.map(v => v === null ? null : v - dcLevel), -3);
            if (bwIdx) {
                let wBw = freqAt(freqRad, bwIdx.index, bwIdx.t);
                document.getElementById('val-bandwidth').innerText = (currentUnit === 'Hz' ? wBw / (2 * Math.PI) : wBw).toPrecision(3) + ' ' + unitLabel;
            } else {
                document.getElementById('val-bandwidth').innerText = t('nd');
            }

            let magLow = validMag[0], magHigh = validMag[validMag.length - 1];
            let behavior;
            if (peakDelta > 3 && magLow < peak - 3 && magHigh < peak - 3) behavior = t('bp');
            else if (magHigh < magLow - 3) behavior = t('lp');
            else if (magLow < magHigh - 3) behavior = t('hp');
            else behavior = t('ap');
            document.getElementById('val-filter-behavior').innerText = behavior;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STUDIO DELLA RISPOSTA TEMPORALE — state-space simulation engine
        // ═══════════════════════════════════════════════════════════════════

        // Builds the controllable-canonical state-space matrices (A, B, C, D)
        // from a transfer function's ascending numerator/denominator
        // coefficients. For an order-0 system (pure gain, no dynamics) there
        // is no state: the output just tracks D*u(t) instantaneously.
        function buildStateSpace(numC, denC) {
            const n = denC.length - 1;
            if (n <= 0) {
                const D = denC[0] ? (numC[0] || 0) / denC[0] : 0;
                return { A: [], B: [], C: [], D, n: 0 };
            }
            const an = denC[n];
            const a = denC.map(v => v / an);           // normalize denominator to monic
            const b = new Array(n + 1).fill(0);
            for (let i = 0; i < numC.length && i <= n; i++) b[i] = numC[i] / an;
            const D = b[n];                              // feed-through term (numerator reaches full degree n)
            const C = new Array(n);
            for (let i = 0; i < n; i++) C[i] = b[i] - D * a[i];
            const A = [];
            for (let i = 0; i < n; i++) {
                const row = new Array(n).fill(0);
                if (i < n - 1) row[i + 1] = 1;
                else for (let j = 0; j < n; j++) row[j] = -a[j];
                A.push(row);
            }
            const B = new Array(n).fill(0);
            B[n - 1] = 1;
            return { A, B, C, D, n };
        }

        // Dynamic simulation horizon: ~5 time constants of the slowest stable
        // pole (the one closest to the imaginary axis), or a 10s default when
        // the system is unstable or has only origin poles (no finite decay
        // rate to time the simulation against).
        function computeTmax(poles, gPole) {
            const stableAbsParts = (poles || []).map(p => toReal(p)).filter(re => re < -1e-6).map(re => Math.abs(re));
            if (gPole > 0 || stableAbsParts.length === 0) return 10;
            const sigmaMin = Math.min(...stableAbsParts);
            let T = 5 / sigmaMin;
            if (!isFinite(T) || T <= 0) return 10;
            return Math.min(Math.max(T, 0.01), 500);
        }

        // Value of the chosen input signal at a given time (the impulse is
        // handled separately, via an initial state jump — see simulateTimeResponse).
        function inputSignalValue(type, time, Tmax, wc) {
            switch (type) {
                case 'ramp': return time;
                case 'square': {
                    const halfPeriod = Tmax / 4; // period = Tmax/2
                    return (Math.floor(time / halfPeriod) % 2 === 0) ? 1 : -1;
                }
                case 'sine': return Math.sin((wc || 1) * time);
                default: return 1; // step
            }
        }

        // n x n matrix times an n-vector.
        function matVecMul(A, x) { return A.map(row => row.reduce((s, aij, j) => s + aij * x[j], 0)); }

        // Simulates the state-space system's response to the chosen input
        // using 4th-order Runge-Kutta integration over 500 fixed steps.
        // The unit impulse is simulated exactly via the classic trick of an
        // initial state jump x(0)=B with zero input afterwards, rather than
        // approximating δ(t) with a narrow pulse (whose plotted amplitude
        // would otherwise depend arbitrarily on the integration step size).
        function simulateTimeResponse(ss, signalType, Tmax, wc) {
            const N = 500, dt = Tmax / N;
            const tArr = [], uArr = [], yArr = [];
            const isImpulse = signalType === 'impulse';

            if (ss.n === 0) {
                for (let k = 0; k <= N; k++) {
                    const time = k * dt;
                    const u = isImpulse ? (k === 0 ? 1 : 0) : inputSignalValue(signalType, time, Tmax, wc);
                    tArr.push(time); uArr.push(u);
                    yArr.push(isImpulse ? (k === 0 ? ss.D : 0) : ss.D * u);
                }
                return { t: tArr, u: uArr, y: yArr };
            }

            const { A, B, C, D, n } = ss;
            let x = isImpulse ? B.slice() : new Array(n).fill(0);
            const uAt = (time) => isImpulse ? 0 : inputSignalValue(signalType, time, Tmax, wc);
            const f = (xVec, uVal) => matVecMul(A, xVec).map((v, i) => v + B[i] * uVal);

            for (let k = 0; k <= N; k++) {
                const time = k * dt;
                tArr.push(time);
                uArr.push(isImpulse ? (k === 0 ? 1 : 0) : uAt(time));
                yArr.push(x.reduce((s, xi, i) => s + C[i] * xi, 0) + D * uAt(time));

                if (k === N) break;
                const u1 = uAt(time), u2 = uAt(time + dt / 2), u4 = uAt(time + dt);
                const k1 = f(x, u1);
                const k2 = f(x.map((xi, i) => xi + dt / 2 * k1[i]), u2);
                const k3 = f(x.map((xi, i) => xi + dt / 2 * k2[i]), u2);
                const k4 = f(x.map((xi, i) => xi + dt * k3[i]), u4);
                x = x.map((xi, i) => xi + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
            }
            return { t: tArr, u: uArr, y: yArr };
        }

        // Performance indicators are always computed from the STEP response,
        // independent of whichever signal is currently shown on the chart —
        // rise time, overshoot, settling time and steady-state error are
        // classic step-response metrics and describe the system itself, not
        // a property of the selected input.
        function computeStepKPIs(t, y, isConvergent) {
            if (!isConvergent) return { yss: null, tr: null, ts: null, overshoot: null, ess: null };

            const yss = y[y.length - 1];
            const ess = 1 - yss;

            let t10 = null, t90 = null;
            const target10 = 0.1 * yss, target90 = 0.9 * yss;
            for (let i = 0; i < y.length; i++) {
                const reached10 = yss >= 0 ? y[i] >= target10 : y[i] <= target10;
                const reached90 = yss >= 0 ? y[i] >= target90 : y[i] <= target90;
                if (t10 === null && reached10) t10 = t[i];
                if (t90 === null && reached90) { t90 = t[i]; break; }
            }
            const tr = (t10 !== null && t90 !== null) ? (t90 - t10) : null;

            let overshoot = 0;
            if (Math.abs(yss) > 1e-9) {
                const extreme = yss >= 0 ? Math.max(...y) : Math.min(...y);
                overshoot = Math.max(0, (Math.abs(extreme) - Math.abs(yss)) / Math.abs(yss) * 100);
            }

            const band = Math.max(Math.abs(yss) * 0.02, 1e-6);
            let lastOutside = -1;
            for (let i = y.length - 1; i >= 0; i--) {
                if (Math.abs(y[i] - yss) > band) { lastOutside = i; break; }
            }
            const ts = lastOutside === -1 ? 0 : t[Math.min(lastOutside + 1, t.length - 1)];

            return { yss, tr, ts, overshoot, ess };
        }

        // Formats a time value in seconds, switching to milliseconds for very
        // short durations so short-lived (high-frequency) systems stay readable.
        function formatTime(v) {
            if (v === null || v === undefined) return t('nd');
            return v < 0.001 ? (v * 1000).toFixed(2) + ' ms' : v.toFixed(3) + ' s';
        }

        // Runs the full temporal-response pipeline for the current transfer
        // function: builds the state-space model, simulates the selected
        // input signal for the chart, always simulates the step response
        // separately for the KPIs, then updates the DOM and the chart.
        function calculateTemporalResponse(analysis) {
            const ss = buildStateSpace(analysis.numC, analysis.denC);
            const Tmax = computeTmax(analysis.poles, analysis.gPole);
            const wc = lastWc || 1;
            const isConvergent = analysis.gPole === 0 && analysis.poles.every(p => toReal(p) < -1e-6);

            const sim = simulateTimeResponse(ss, currentSignal, Tmax, wc);
            const stepSim = currentSignal === 'step' ? sim : simulateTimeResponse(ss, 'step', Tmax, wc);
            const kpis = computeStepKPIs(stepSim.t, stepSim.y, isConvergent);

            lastTemporalData = { t: sim.t, u: sim.u, y: sim.y, kpis, signal: currentSignal };

            document.getElementById('val-yss').textContent = kpis.yss === null ? t('nd') : kpis.yss.toFixed(3);
            document.getElementById('val-ess').textContent = kpis.ess === null ? t('nd') : kpis.ess.toFixed(3);
            document.getElementById('val-tr').textContent = formatTime(kpis.tr);
            document.getElementById('val-ts').textContent = formatTime(kpis.ts);
            document.getElementById('val-overshoot').textContent = kpis.overshoot === null ? t('nd') : kpis.overshoot.toFixed(1) + '%';

            renderTemporalChart(sim.t, sim.u, sim.y);
        }

        // Draws (or redraws) the temporal response chart: a dashed neutral
        // line for the input signal and a solid indigo/violet line for the
        // system's output — the same palette in both light and dark mode.
        // The Input/Output legend is a custom HTML pill pair (see
        // toggleTemporalDataset), not Chart.js's built-in canvas legend, so
        // it can match the site's rounded-full button styling.
        function renderTemporalChart(tArr, uArr, yArr) {
            const canvas = document.getElementById('temporalChart');
            if (!canvas) return;

            const gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
            const textColor = isDarkMode ? '#9aa7b8' : '#6b7280';
            const outputColor = isDarkMode ? '#818cf8' : '#6366f1';
            const inputColor = isDarkMode ? '#6b7280' : '#9ca3af';

            // Sync the custom legend pills' colors and default (visible) state.
            const outBtn = document.getElementById('legend-btn-output');
            const inBtn = document.getElementById('legend-btn-input');
            const outDot = document.getElementById('legend-dot-output');
            const inDot = document.getElementById('legend-dot-input');
            if (outBtn) { outBtn.style.setProperty('--legend-color', outputColor); outBtn.classList.add('active'); outBtn.classList.remove('inactive'); }
            if (inBtn) { inBtn.style.setProperty('--legend-color', inputColor); inBtn.classList.add('active'); inBtn.classList.remove('inactive'); }
            if (outDot) outDot.style.backgroundColor = outputColor;
            if (inDot) inDot.style.backgroundColor = inputColor;
            const outLabel = document.getElementById('legend-label-output'); if (outLabel) outLabel.textContent = t('outputLbl');
            const inLabel = document.getElementById('legend-label-input'); if (inLabel) inLabel.textContent = t('inputLbl');

            if (temporalChart) temporalChart.destroy();
            temporalChart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: tArr.map(v => v.toFixed(3)),
                    datasets: [
                        { label: t('outputLbl'), data: yArr, borderColor: outputColor, borderWidth: 2.5, tension: 0.15, pointRadius: 0 },
                        { label: t('inputLbl'), data: uArr, borderColor: inputColor, borderDash: [5, 5], borderWidth: 1.5, tension: 0, pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 8, font: { size: 11 } }, title: { display: true, text: 't (s)', color: textColor, font: { size: 12, weight: '600' } } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // Toggles one dataset (0 = output, 1 = input) on/off, mirroring the
        // visual style of Chart.js's own clickable legend but as real,
        // fully-rounded pill buttons matching the site's design.
        function toggleTemporalDataset(index) {
            if (!temporalChart) return;
            const meta = temporalChart.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !temporalChart.data.datasets[index].hidden : !meta.hidden;
            temporalChart.update();
            const btn = document.getElementById(index === 0 ? 'legend-btn-output' : 'legend-btn-input');
            if (btn) btn.classList.toggle('inactive', !!meta.hidden);
        }

        // ── Custom signal dropdown (name + mini waveform SVG + formula) ─────
        const SIGNAL_ORDER = ['step', 'impulse', 'ramp', 'square', 'sine'];
        const SIGNAL_META = {
            step:    { nameKey: 'sigStep',    formula: 'u(t) = 1(t)',
                svg: '<svg viewBox="0 0 60 24" class="w-10 h-6"><path d="M2 20 H22 V4 H58" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
            impulse: { nameKey: 'sigImpulse', formula: 'u(t) = δ(t)',
                svg: '<svg viewBox="0 0 60 24" class="w-10 h-6"><path d="M2 20 H26 L30 3 L34 20 H58" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
            ramp:    { nameKey: 'sigRamp',    formula: 'u(t) = t',
                svg: '<svg viewBox="0 0 60 24" class="w-10 h-6"><path d="M2 22 L58 2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>' },
            square:  { nameKey: 'sigSquare',  formula: 'u(t) = sgn(sin ωt)',
                svg: '<svg viewBox="0 0 60 24" class="w-10 h-6"><path d="M2 5 H16 V19 H30 V5 H44 V19 H58" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
            sine:    { nameKey: 'sigSine',    formula: 'u(t) = sin(ωc·t)',
                svg: '<svg viewBox="0 0 60 24" class="w-10 h-6"><path d="M2 12 C10 2 16 2 20 12 C24 22 30 22 34 12 C38 2 44 2 48 12 C52 20 55 20 58 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>' }
        };

        // Builds the dropdown's option list from SIGNAL_META (avoids
        // duplicating the waveform SVGs between the button and the menu).
        function buildSignalMenu() {
            const menu = document.getElementById('signal-menu');
            if (!menu) return;
            menu.innerHTML = SIGNAL_ORDER.map(key => {
                const m = SIGNAL_META[key];
                return `<button type="button" onclick="selectSignal('${key}')" class="signal-option w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-100 dark:hover:bg-gray-700 cursor-pointer">
                    <span class="w-10 h-6 flex items-center justify-center text-stone-500 dark:text-gray-400 shrink-0">${m.svg}</span>
                    <span class="min-w-0">
                        <span class="block text-sm font-bold text-stone-800 dark:text-darktext">${t(m.nameKey)}</span>
                        <span class="block text-[11px] text-stone-500 dark:text-gray-400 font-mono">${m.formula}</span>
                    </span>
                </button>`;
            }).join('');
        }

        // Refreshes the dropdown button's icon/name/formula to match currentSignal.
        function updateSignalButtonDisplay() {
            const m = SIGNAL_META[currentSignal];
            const icon = document.getElementById('signal-btn-icon');
            const name = document.getElementById('signal-btn-name');
            const formula = document.getElementById('signal-btn-formula');
            if (icon) icon.innerHTML = m.svg;
            if (name) name.textContent = t(m.nameKey);
            if (formula) formula.textContent = m.formula;
        }

        // Shows/hides the signal dropdown panel.
        function toggleSignalMenu() { document.getElementById('signal-menu').classList.toggle('open'); }

        // Selects a new input signal, refreshes the button display, and
        // re-simulates immediately if a transfer function is already shown.
        function selectSignal(type) {
            currentSignal = type;
            document.getElementById('signal-menu').classList.remove('open');
            updateSignalButtonDisplay();
            if (isInterfaceExpanded && lastFreqDisplay.length) {
                let analysis = null;
                try { analysis = computeTFAnalysis(document.getElementById('tfInput').value); } catch(e) {}
                if (analysis) calculateTemporalResponse(analysis);
            }
        }

        document.addEventListener('click', (e) => {
            const container = document.getElementById('signal-dropdown-container');
            if (container && !container.contains(e.target)) {
                const menu = document.getElementById('signal-menu');
                if (menu) menu.classList.remove('open');
            }
        });

        // ═══════════════════════════════════════════════════════════════════
        // DIAGRAMMA DI NYQUIST
        // ═══════════════════════════════════════════════════════════════════

        // Winding number of a closed polyline around the point (cx, cy):
        // sums the signed angle swept at each step and divides by 2π. This
        // is the standard, robust way to count encirclements numerically
        // (no special-casing needed for how many times the curve crosses
        // any particular ray from the point).
        function windingNumberAround(pts, cx, cy) {
            let total = 0;
            for (let i = 0; i < pts.length - 1; i++) {
                const a1 = Math.atan2(pts[i].y - cy, pts[i].x - cx);
                const a2 = Math.atan2(pts[i + 1].y - cy, pts[i + 1].x - cx);
                let d = a2 - a1;
                while (d > Math.PI) d -= 2 * Math.PI;
                while (d < -Math.PI) d += 2 * Math.PI;
                total += d;
            }
            return total / (2 * Math.PI);
        }

        // Builds the Nyquist contour and its stability indicators from the
        // already-computed Bode sweep (reuses lastFreqRad/lastMagData/
        // lastPhaseData — no need to re-evaluate the transfer function).
        // The contour follows the standard convention (ω sweeping from -∞
        // to +∞): the mirrored branch (ω<0, the complex conjugate) is drawn
        // first, then the positive branch, so the two connect into one
        // continuous curve for the winding-number calculation.
        // Evaluates a polynomial (ascending coefficients) at a complex point
        // via Horner's method.
        function evalPolyAt(coeffsAsc, s) {
            let result = math.complex(0, 0);
            for (let i = coeffsAsc.length - 1; i >= 0; i--) {
                result = math.add(math.multiply(result, s), math.complex(coeffsAsc[i], 0));
            }
            return result;
        }
        function evalTFAt(numC, denC, s) { return math.divide(evalPolyAt(numC, s), evalPolyAt(denC, s)); }

        // When G(s) has a pole at the origin, the Nyquist contour must
        // indent around it with a small semicircle (radius ε) bulging into
        // the right half-plane. Rather than approximating this with a
        // straight line or a hand-derived sweep formula — both were tested
        // and found to give the wrong encirclement count for double (or
        // higher) origin poles — this evaluates the *real* transfer
        // function directly on that semicircle, which is correct by
        // construction for any pole multiplicity.
        function buildOriginIndentation(numC, denC, poles, zeros) {
            const finiteMags = poles.concat(zeros).map(p => cMag(p)).filter(m => m > 1e-9);
            const eps = finiteMags.length ? Math.min(1e-4, Math.min(...finiteMags) * 1e-4) : 1e-6;
            const steps = 200;
            const pts = [];
            for (let k = 0; k <= steps; k++) {
                const theta = -Math.PI / 2 + Math.PI * (k / steps);
                const s = math.complex(eps * Math.cos(theta), eps * Math.sin(theta));
                const g = evalTFAt(numC, denC, s);
                pts.push({ x: g.re, y: g.im });
            }
            return pts;
        }

        function calculateNyquist(analysis) {
            // Nyquist gets its own frequency sweep, scaled to the system's
            // actual pole/zero magnitudes. The fixed global Bode sweep
            // (1e-2 to 1e9 rad/s) doesn't adapt to extreme cases — for a
            // pole at, say, -1e-8, the interesting near-DC transition
            // happens around 1e-8 rad/s, far below that fixed sweep's
            // minimum, so the true curve shape was never even sampled.
            const charMags = analysis.poles.concat(analysis.zeros).map(p => cMag(p)).filter(m => m > 1e-12);
            const wLow = charMags.length ? Math.min(...charMags) * 1e-3 : 1e-3;
            const wHigh = charMags.length ? Math.max(...charMags) * 1e3 : 1e3;
            const decStart = Math.floor(Math.log10(wLow)), decEnd = Math.ceil(Math.log10(wHigh));
            const sweep = [];
            for (let dec = decStart; dec <= decEnd; dec += 0.02) sweep.push(Math.pow(10, dec));

            const posBranch = [], negBranch = [];
            sweep.forEach(w => {
                const g = evalTFAt(analysis.numC, analysis.denC, math.complex(0, w));
                posBranch.push({ x: g.re, y: g.im });
                negBranch.push({ x: g.re, y: -g.im }); // conjugate, for ω<0
            });

            // Full closed contour: ω from -∞ (reversed negative branch) to
            // +∞, indenting around the origin in between when needed.
            const revNeg = negBranch.slice().reverse();
            const fullContour = analysis.gPole > 0
                ? revNeg.concat(buildOriginIndentation(analysis.numC, analysis.denC, analysis.poles, analysis.zeros)).concat(posBranch)
                : revNeg.concat(posBranch);

            const P = analysis.poles.filter(p => toReal(p) > 1e-6).length; // open-loop poles in the right half-plane
            // windingNumberAround returns the mathematical (counterclockwise-
            // positive) winding number; the classical Nyquist criterion's N
            // counts *clockwise* encirclements, hence the sign flip.
            const N = -Math.round(windingNumberAround(fullContour, -1, 0));
            const Z = N + P;
            const stable = closedLoopStability(analysis); // exact verdict (characteristic-polynomial roots), shown as the definitive badge

            let minDist = Infinity;
            fullContour.forEach(pt => { minDist = Math.min(minDist, Math.hypot(pt.x + 1, pt.y)); });

            const fullBounds = computeNyquistBounds(posBranch, negBranch);
            const initBounds = computeNyquistInitialView(posBranch);
            lastNyquistData = { posBranch, negBranch, P, N, Z, minDist, stable, fullBounds, initBounds };

            document.getElementById('val-nyquist-p').textContent = P;
            document.getElementById('val-nyquist-n').textContent = N;
            document.getElementById('val-nyquist-z').textContent = Z;
            document.getElementById('val-nyquist-dist').textContent = isFinite(minDist) ? minDist.toPrecision(3) : t('nd');

            const stEl = document.getElementById('val-nyquist-stability');
            stEl.textContent = stable ? t('stable') : t('unstable');
            stEl.className = 'text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-md inline-block mt-1 ' + (stable
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400');

            renderNyquistChart(posBranch, negBranch, initBounds, fullBounds);
        }

        // The full data-driven bounding box (every plotted point + 12%
        // margin) — used only as the outer pan/zoom limit, so the complete
        // curve is always reachable by zooming out, exactly like MATLAB's
        // nyquist(). No longer forces the critical point into the frame:
        // that was harmless for huge curves but unnecessary, and this box
        // is not what's shown by default (see computeNyquistInitialView).
        function computeNyquistBounds(posBranch, negBranch) {
            let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
            posBranch.concat(negBranch).forEach(p => {
                if (!isFinite(p.x) || !isFinite(p.y)) return;
                if (p.x < xMin) xMin = p.x;
                if (p.x > xMax) xMax = p.x;
                if (p.y < yMin) yMin = p.y;
                if (p.y > yMax) yMax = p.y;
            });
            if (!isFinite(xMin) || !isFinite(xMax)) { xMin = -3; xMax = 3; }
            if (!isFinite(yMin) || !isFinite(yMax)) { yMin = -3; yMax = 3; }
            const marginX = Math.max((xMax - xMin) * 0.12, 0.5);
            const marginY = Math.max((yMax - yMin) * 0.12, 0.5);
            return { xMin: xMin - marginX, xMax: xMax + marginX, yMin: yMin - marginY, yMax: yMax + marginY };
        }

        // The default view shown when the diagram is first drawn: based on
        // the MEDIAN magnitude of the curve rather than its full extent, so
        // it stays immediately legible even when a very small (or very
        // large) pole/zero makes the full curve span many orders of
        // magnitude — without this, systems like that required a lot of
        // manual zooming just to see anything.
        // The default view shown when the diagram is first drawn. The
        // stability-relevant part of ANY Nyquist curve (the crossings near
        // the critical point -1+j0) always lives in a small, predictable
        // window around the origin — regardless of how extreme the
        // system's poles/zeros are elsewhere in frequency. A percentile/
        // median-based heuristic was still fragile (some systems still
        // needed a lot of manual zooming), so this uses a fixed, always-
        // consistent default window instead, matching what tools like
        // Wolfram Alpha or MATLAB show immediately for any system. Only
        // falls back to a computed window for the rare pathological case
        // where the curve never comes anywhere near that default at all
        // (e.g. an extremely low- or high-gain system).
        function computeNyquistInitialView(posBranch) {
            const DEFAULT_BOUND = 5;
            const mags = posBranch.map(p => Math.hypot(p.x, p.y)).filter(m => isFinite(m));
            const hasNearbyPoint = mags.some(m => m < DEFAULT_BOUND * 1.5);
            if (hasNearbyPoint || !mags.length) {
                return { xMin: -DEFAULT_BOUND, xMax: DEFAULT_BOUND, yMin: -DEFAULT_BOUND, yMax: DEFAULT_BOUND };
            }
            // Curve never approaches the default window: center on whichever
            // point's magnitude is closest to 1 (the crossover-like region).
            let bestMag = mags[0], bestDiff = Infinity;
            mags.forEach(m => {
                const d = Math.abs(Math.log10(m || 1e-12));
                if (d < bestDiff) { bestDiff = d; bestMag = m; }
            });
            const bound = Math.max(bestMag * 3, DEFAULT_BOUND);
            return { xMin: -bound, xMax: bound, yMin: -bound, yMax: bound };
        }

        // Draws (or redraws) the Nyquist chart: solid curve for ω>0, a
        // lighter dashed mirror for ω<0, and a marked critical point (-1,0).
        // Opens on the compact `initBounds` view; zooming out is limited to
        // `fullBounds` (the complete curve), never further.
        function renderNyquistChart(posBranch, negBranch, initBounds, fullBounds) {
            const canvas = document.getElementById('nyquistChart');
            if (!canvas) return;
            const gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
            const textColor = isDarkMode ? '#9aa7b8' : '#6b7280';
            const curveColor = isDarkMode ? '#818cf8' : '#6366f1';
            const mirrorColor = isDarkMode ? '#6b7280' : '#9ca3af';
            const criticalColor = isDarkMode ? '#f87171' : '#dc2626';
            const mCircleColor = isDarkMode ? '#4b5563' : '#d1d5db';
            const nCircleColor = isDarkMode ? '#5b4b6b' : '#e0d1f0';

            const datasets = [
                { label: 'ω > 0', data: posBranch, borderColor: curveColor, borderWidth: 2.5, pointRadius: 0, showLine: true, tension: 0 },
                { label: 'ω < 0', data: negBranch, borderColor: mirrorColor, borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, showLine: true, tension: 0 },
                { label: '-1 + j0', data: [{ x: -1, y: 0 }], borderColor: criticalColor, backgroundColor: criticalColor, pointRadius: 6, pointStyle: 'crossRot', pointBorderWidth: 3, showLine: false }
            ];
            if (hallChartOn) {
                // Standard M-circle levels (closed-loop gain, unity feedback), in dB.
                [-6, -3, 0, 3, 6].forEach(db => {
                    const M = Math.pow(10, db / 20);
                    datasets.push({ label: `M=${db}dB`, data: buildMCircle(M, 120), borderColor: mCircleColor, borderWidth: 1, borderDash: [2, 3], pointRadius: 0, showLine: true, tension: 0 });
                });
                // Standard N-circle levels (closed-loop phase, unity feedback), in degrees.
                [-10, -20, -30, -60, -90, -120, -150].forEach(deg => {
                    datasets.push({ label: `N=${deg}°`, data: buildNCircle(deg, 120), borderColor: nCircleColor, borderWidth: 1, borderDash: [1, 3], pointRadius: 0, showLine: true, tension: 0 });
                });
            }

            if (nyquistChart) nyquistChart.destroy();
            const isMobileNyq = window.innerWidth < 640;
            nyquistChart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { intersect: false },
                    layout: { padding: { left: isMobileNyq ? 2 : 6, right: isMobileNyq ? 4 : 10, top: isMobileNyq ? 2 : 6, bottom: isMobileNyq ? 2 : 6 } },
                    scales: {
                        x: { type: 'linear', min: initBounds.xMin, max: initBounds.xMax, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, title: { display: true, text: 'Re', color: textColor, font: { size: 12, weight: '600' }, padding: { top: isMobileNyq ? 2 : 6 } } },
                        y: { type: 'linear', min: initBounds.yMin, max: initBounds.yMax, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, title: { display: true, text: 'Im', color: textColor, font: { size: 12, weight: '600' }, padding: { bottom: isMobileNyq ? 2 : 6 } } }
                    },
                    plugins: {
                        legend: { display: false },
                        zoom: {
                            limits: { x: { min: fullBounds.xMin, max: fullBounds.xMax }, y: { min: fullBounds.yMin, max: fullBounds.yMax } },
                            pan: { enabled: true, mode: 'xy' },
                            zoom: {
                                wheel: { enabled: false }, // requires a click on the chart first — see activateChartZoom()
                                pinch: { enabled: true }, mode: 'xy'
                            }
                        }
                    }
                }
            });
            makeChartClickActivatable(nyquistChart, canvas);
        }

        // Restores the Nyquist chart to its initial suggested view.
        function resetNyquistZoom() {
            if (nyquistChart && typeof nyquistChart.resetZoom === 'function') nyquistChart.resetZoom();
        }

        // ═══════════════════════════════════════════════════════════════════
        // DIAGRAMMA DI NICHOLS — open-loop phase (x) vs gain in dB (y)
        // ═══════════════════════════════════════════════════════════════════
        let nicholsChart;
        let lastNicholsData = null;

        // Builds the Nichols curve directly from the already-computed Bode
        // sweep (phase in degrees on x, magnitude in dB on y) and mirrors
        // the same PM/GM/crossover values already shown in the Stability
        // card, so the two panels always agree.
        function calculateNichols(analysis) {
            if (!lastFreqRad.length) return;
            const points = [];
            for (let i = 0; i < lastFreqRad.length; i++) {
                const mag = lastMagData[i], ph = lastPhaseData[i];
                if (mag === null || ph === null) continue;
                points.push({ x: ph, y: mag });
            }
            lastNicholsData = { points };

            const copy = (fromId, toId) => {
                const from = document.getElementById(fromId), to = document.getElementById(toId);
                if (from && to) to.textContent = from.textContent;
            };
            copy('val-pm', 'val-nichols-pm');
            copy('val-gm', 'val-nichols-gm');
            copy('val-wc', 'val-nichols-wc');
            copy('val-w180', 'val-nichols-w180');

            renderNicholsChart(points);
        }

        // Draws (or redraws) the Nichols chart with the critical point
        // (-180°, 0dB) marked, matching the Nyquist panel's visual style.
        function renderNicholsChart(points) {
            const canvas = document.getElementById('nicholsChart');
            if (!canvas) return;
            const gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
            const textColor = isDarkMode ? '#9aa7b8' : '#6b7280';
            const curveColor = isDarkMode ? '#818cf8' : '#6366f1';
            const criticalColor = isDarkMode ? '#f87171' : '#dc2626';

            if (nicholsChart) nicholsChart.destroy();
            const isMobileNic = window.innerWidth < 640;
            nicholsChart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: {
                    datasets: [
                        { label: 'G(jω)', data: points, borderColor: curveColor, borderWidth: 2.5, pointRadius: 0, showLine: true, tension: 0 },
                        { label: '-180°, 0dB', data: [{ x: -180, y: 0 }], borderColor: criticalColor, backgroundColor: criticalColor, pointRadius: 6, pointStyle: 'crossRot', pointBorderWidth: 3, showLine: false }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { intersect: false },
                    layout: { padding: { left: isMobileNic ? 2 : 6, right: isMobileNic ? 4 : 10, top: isMobileNic ? 2 : 6, bottom: isMobileNic ? 2 : 6 } },
                    scales: {
                        x: { type: 'linear', grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, title: { display: true, text: 'Fase (°)', color: textColor, font: { size: 12, weight: '600' }, padding: { top: isMobileNic ? 2 : 6 } } },
                        y: { type: 'linear', grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: yTickCallback }, title: { display: true, text: 'Modulo (dB)', color: textColor, font: { size: 12, weight: '600' }, padding: { bottom: isMobileNic ? 2 : 6 } } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }

        // ── "Carta Semilog" — classic semi-log graph-paper look for Bode ────
        // charts: denser sub-decade gridlines (2,3,4...9 within each decade,
        // not just the labeled powers of ten) in the traditional light-blue
        // graph-paper tone.
        let semilogState = { mag: false, phase: false };
        function toggleSemilogGrid(chartKey) {
            semilogState[chartKey] = !semilogState[chartKey];
            const chart = chartKey === 'mag' ? magChart : phaseChart;
            const btn = document.getElementById(`btn-semilog-${chartKey}`);
            if (btn) btn.classList.toggle('mini-dock-active', semilogState[chartKey]);
            if (!chart) return;
            const on = semilogState[chartKey];
            const gridColor = on ? (isDarkMode ? '#3b5170' : '#bfdbfe') : (isDarkMode ? '#2a3441' : '#e5e7eb');
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.x.ticks.maxTicksLimit = on ? 200 : (window.innerWidth < 640 ? 7 : 12);
            chart.update();
        }

        // ── "Carta di Hall" — constant-closed-loop-gain (M) circles ─────────
        // overlaid on the Nyquist plane. Standard analytic formulas (unity
        // feedback): for M=1 the locus is the vertical line Re(G)=-1/2; for
        // M≠1 it's a circle centered at (-M²/(M²-1), 0) with radius
        // |M/(M²-1)|. Shown for a handful of standard dB levels.
        let hallChartOn = false;
        function buildMCircle(M, steps) {
            const pts = [];
            if (Math.abs(M - 1) < 1e-6) {
                for (let k = 0; k <= steps; k++) {
                    const t = -50 + 100 * (k / steps);
                    pts.push({ x: -0.5, y: t });
                }
                return pts;
            }
            const cx = -(M * M) / (M * M - 1);
            const r = Math.abs(M / (M * M - 1));
            for (let k = 0; k <= steps; k++) {
                const theta = 2 * Math.PI * (k / steps);
                pts.push({ x: cx + r * Math.cos(theta), y: r * Math.sin(theta) });
            }
            return pts;
        }
        // N-circles: constant closed-loop PHASE contours (unity feedback),
        // arg(G/(1+G)) = φ. Analytic locus: center (-1/2, 1/(2·tanφ)),
        // radius = (1/2)·√(1+1/tan²φ) — verified numerically against direct
        // evaluation of arg(G/(1+G)) before use. Every N-circle passes
        // through both the origin and the critical point -1+j0 (where the
        // phase is not well-defined), which shows up as a tiny visual
        // pinch at those two points — this is expected, not a bug.
        function buildNCircle(phiDeg, steps) {
            const phi = phiDeg * Math.PI / 180;
            const N = Math.tan(phi);
            if (Math.abs(N) < 1e-9) {
                const pts = [];
                for (let k = 0; k <= steps; k++) { const t = -50 + 100 * (k / steps); pts.push({ x: t, y: 0 }); }
                return pts;
            }
            const cx = -0.5, cy = 1 / (2 * N);
            const r = 0.5 * Math.sqrt(1 + 1 / (N * N));
            const pts = [];
            for (let k = 0; k <= steps; k++) {
                const theta = 2 * Math.PI * (k / steps);
                pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
            }
            return pts;
        }
        function toggleHallChart() {
            hallChartOn = !hallChartOn;
            const btn = document.getElementById('btn-hall-toggle');
            if (btn) btn.classList.toggle('mini-dock-active', hallChartOn);
            if (lastNyquistData) renderNyquistChart(lastNyquistData.posBranch, lastNyquistData.negBranch, lastNyquistData.initBounds, lastNyquistData.fullBounds);
        }

        // ── X-axis tick formatter: only powers of 10, shown as 10ⁿ ──────────
        const SUPERSCRIPTS = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
        // Converts a number (or string of digits) into unicode superscript characters, e.g. '23' -> '²³'.
        function toSuperscript(n) { return String(n).split('').map(c => SUPERSCRIPTS[c] || c).join(''); }
        // Chart.js tick-formatting callback: only labels ticks that are exact powers of 10, in '10ⁿ' exponential notation.
        function xTickCallback(value) {
            const exp = Math.round(Math.log10(value));
            if (Math.abs(Math.pow(10, exp) - value) / (value || 1) < 0.01) {
                return '10' + toSuperscript(exp);
            }
            return '';
        }

        // ── Y-axis tick formatter: max 1 decimal digit, compact ×10ⁿ notation for large/small values ──
function yTickCallback(value) {
    if (value === 0) return '0';
    const absV = Math.abs(value);
    if (absV >= 1000 || absV < 0.01) {
        const exp = Math.floor(Math.log10(absV));
        const mantissa = value / Math.pow(10, exp);
        return mantissa.toFixed(1) + '×10' + toSuperscript(exp);
    }
    return value.toFixed(1);
}

        // ── Generate Bode ─────────────────────────────────────────────────────
        // mathjs's complex.toPolar() returns the *wrapped* principal angle,
        // always in (-180°, 180°]. For systems whose true phase drops past
        // -180° (any order-3+ system, or lower relative degree with enough
        // phase lag), the wrapped value jumps back up near +180° instead of
        // continuing down — which hides the real -180° crossing entirely and
        // makes the computed Gain Margin come out as "∞" even when the
        // system is actually unstable. Unwrap the sampled phase sequence so
        // it is continuous before using it for anything (plotting, margins).
        // Removes artificial ±360° jumps from a sequence of wrapped (-180°,180°] phase samples so the curve is continuous — needed because mathjs's toPolar() always returns the wrapped principal angle, which would otherwise hide the true -180° crossing (and gain margin) for systems whose phase drops past -180°.
        function unwrapPhaseDeg(arr) {
            const out = [];
            let offset = 0, prevRaw = null;
            for (let i = 0; i < arr.length; i++) {
                const v = arr[i];
                if (v === null) { out.push(null); prevRaw = null; continue; }
                if (prevRaw !== null) {
                    const diff = v - prevRaw;
                    if (diff > 180) offset -= 360;
                    else if (diff < -180) offset += 360;
                }
                out.push(v + offset);
                prevRaw = v;
            }
            return out;
        }

        // Samples the transfer function across the whole frequency sweep, builds the real/asymptotic/contribution curves, and triggers the chart and parameter-panel rendering.
        function generateBode() {
            const exprStr = document.getElementById('tfInput').value;
            let code;
            try { code = math.compile(exprStr); } catch(e) { return; }

            let analysis = null;
            try { analysis = computeTFAnalysis(exprStr); } catch(e) {}

            let magData = [], phaseData = [], freqRad = [], freqDisplay = [];
            frequenciesHz.forEach(f => {
                let w = f * 2 * Math.PI;
                freqRad.push(w);
                freqDisplay.push(currentUnit === 'Hz' ? f : w);
                try {
                    const s = math.complex(0, w);
                    const res = code.evaluate({ s });
                    const polar = (res && res.toPolar) ? res.toPolar() : { r: cMag(res), phi: 0 };
                    magData.push(20 * Math.log10(polar.r));
                    phaseData.push(polar.phi * (180 / Math.PI));
                } catch(e) { magData.push(null); phaseData.push(null); }
            });
            phaseData = unwrapPhaseDeg(phaseData);

            let asympMagData = [], asympPhaseData = [], contributionCurves = [];

            if (analysis) {
                let poleGroups = groupRoots(analysis.poles);
                let zeroGroups = groupRoots(analysis.zeros);
                let startLevel = magData[0] !== null ? magData[0] : 0;

                asympMagData = buildAsymptoticCurve(poleGroups, zeroGroups, analysis.gPole, analysis.gZero, freqRad, startLevel);
                asympPhaseData = buildAsymptoticPhase(poleGroups, zeroGroups, freqRad, phaseData[0]);
                contributionCurves = buildContributionCurves(analysis, freqRad);

                lastFreqDisplay = freqDisplay;
                lastFreqRad = freqRad;
                lastMagData = magData;
                lastPhaseData = phaseData;
                lastAsympMagData = asympMagData;
                lastAsympPhaseData = asympPhaseData;

                updateParameterPanel(analysis, freqRad, freqDisplay, magData, phaseData);
                try { calculateTemporalResponse(analysis); } catch(e) { console.error('Temporal response error:', e); }
                try { calculateNyquist(analysis); } catch(e) { console.error('Nyquist error:', e); }
                try { calculateNichols(analysis); } catch(e) { console.error('Nichols error:', e); }
            }

            lastContributionCurves = contributionCurves;

            renderContributionsMenu(contributionCurves);
            renderCharts(freqDisplay, magData, phaseData, asympMagData, asympPhaseData, contributionCurves);
        }

        // ── Render Charts ─────────────────────────────────────────────────────
        // Assembles the Chart.js dataset arrays (real curve, asymptotes, individual contributions) according to which visualization layers are currently active.
        // Builds the dataset array for one chart (magnitude or phase) using
        // the given layer-visibility state — factored out so the mini-docks
        // can rebuild just one chart independently of the other.
        function buildDatasetsForChart(magData, phaseData, asympMagData, asympPhaseData, contributionCurves, layers, isPhase, visibilityMap) {
            contributionCurves = contributionCurves || [];
            visibilityMap = visibilityMap || contributionVisibility;
            const datasets = [];
            const mainData = isPhase ? phaseData : magData;
            const asympData = isPhase ? asympPhaseData : asympMagData;
            const unitLabel = isPhase ? ' (°)' : ' (dB)';
            const dataKey = isPhase ? 'dataPhase' : 'dataMag';
            const asympKey = isPhase ? 'dataPhaseAsymp' : 'dataMagAsymp';

            if (layers.real) {
                const realColor = isDarkMode ? '#f5efe0' : '#000000';
                datasets.push({ label: t('real') + unitLabel, data: mainData, borderColor: realColor, borderWidth: 2, tension: 0.4, pointRadius: 0 });
            }
            if (layers.asymptotic) {
                datasets.push({ label: t('asymp') + unitLabel, data: asympData, borderColor: '#10b981', borderDash: [5, 5], borderWidth: 2, pointRadius: 0 });
            }
            if (layers.contributions) {
                contributionCurves.forEach(c => {
                    if (visibilityMap[c.id] === false) return;
                    if (layers.real) datasets.push({ data: c[dataKey], borderColor: c.color, borderWidth: 1.5, pointRadius: 0, tension: 0.4 });
                    if (layers.asymptotic && c[asympKey]) datasets.push({ data: c[asympKey], borderColor: c.color, borderDash: [4, 4], borderWidth: 1, pointRadius: 0, tension: 0 });
                });
            }
            return datasets;
        }

        function buildChartDatasets(magData, phaseData, asympMagData, asympPhaseData, contributionCurves, magLayers, phaseLayers, magVisibility, phaseVisibility) {
            magLayers = magLayers || activeLayersMag;
            phaseLayers = phaseLayers || activeLayersPhase;
            magVisibility = magVisibility || contributionVisibilityMag;
            phaseVisibility = phaseVisibility || contributionVisibilityPhase;
            const datasetsMag = buildDatasetsForChart(magData, phaseData, asympMagData, asympPhaseData, contributionCurves, magLayers, false, magVisibility);
            const datasetsPhase = buildDatasetsForChart(magData, phaseData, asympMagData, asympPhaseData, contributionCurves, phaseLayers, true, phaseVisibility);
            return { datasetsMag, datasetsPhase };
        }

        // Draws (or redraws) the magnitude and phase Chart.js charts with the current data, colors and axis settings.
        function renderCharts(labels, magData, phaseData, asympMagData, asympPhaseData, contributionCurves) {
            const magCanvas = document.getElementById('magnitudeChart');
            const phaseCanvas = document.getElementById('phaseChart');
            const magCtx = magCanvas.getContext('2d');
            const phaseCtx = phaseCanvas.getContext('2d');

            // A fresh calculation resets each chart's individual mini-dock
            // override back to whatever the shared floating dock shows.
            activeLayersMag = { ...activeLayers };
            activeLayersPhase = { ...activeLayers };
            contributionVisibilityMag = { ...contributionVisibility };
            contributionVisibilityPhase = { ...contributionVisibility };
            updateMiniDockUI('mag');
            updateMiniDockUI('phase');
            renderMiniContribPills('mag');
            renderMiniContribPills('phase');
            semilogState = { mag: false, phase: false };
            ['mag', 'phase'].forEach(k => { const b = document.getElementById(`btn-semilog-${k}`); if (b) b.classList.remove('mini-dock-active'); });

            let gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
            let textColor = isDarkMode ? '#9aa7b8' : '#6b7280';

            const { datasetsMag, datasetsPhase } = buildChartDatasets(magData, phaseData, asympMagData, asympPhaseData, contributionCurves, activeLayersMag, activeLayersPhase);

            const isMobile = window.innerWidth < 640;
            const axisFontSize = isMobile ? 10 : 15;
            const axisTitleFontSize = isMobile ? 10 : 15;
            const xUnitLabel = currentUnit === 'Hz' ? 'Hz' : 'rad/s';

            // Builds a Chart.js options object (axes, grid, fonts, units) for one chart given its Y-axis label ('dB' or '°').
            function makeChartOptions(yLabel) {
                return {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { left: isMobile ? 2 : 6, right: isMobile ? 6 : 12, top: isMobile ? 2 : 8, bottom: isMobile ? 2 : 6 } },
                    scales: {
                        x: {
                            type: 'logarithmic', grid: { color: gridColor },
                            title: { display: true, text: xUnitLabel, color: textColor, font: { size: axisTitleFontSize, weight: '600' }, padding: { top: isMobile ? 2 : 6 } },
                            ticks: { color: textColor, maxTicksLimit: isMobile ? 7 : 12, font: { size: axisFontSize }, callback: xTickCallback }
                        },
                      y: {
                            grid: { color: gridColor },
                            ticks: { color: textColor, font: { size: axisFontSize }, callback: yTickCallback },
                            title: { display: true, text: yLabel, color: textColor, font: { size: axisTitleFontSize, weight: '600' } }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                };
            }

            if (magChart) magChart.destroy();
            magChart = new Chart(magCtx, { type: 'line', data: { labels, datasets: datasetsMag }, options: makeChartOptions('dB') });

            if (phaseChart) phaseChart.destroy();
            phaseChart = new Chart(phaseCtx, { type: 'line', data: { labels, datasets: datasetsPhase }, options: makeChartOptions('°') });
        }

        let resizeRedrawTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeRedrawTimeout);
            resizeRedrawTimeout = setTimeout(() => {
                if (isInterfaceExpanded && lastFreqDisplay.length) {
                    renderCharts(lastFreqDisplay, lastMagData, lastPhaseData, lastAsympMagData, lastAsympPhaseData, lastContributionCurves);
                }
            }, 250);
        });

        // Renders a chart off-screen at a fixed size and fixed font, independent of the current device — this is what makes the exported PDF look identical whether it's generated from a phone, a tablet or a desktop.
        function renderExportChart(datasets, yLabel) {
            const FW = 1600, FH = 720;
            const off = document.createElement('canvas');
            off.width = FW; off.height = FH;
            off.style.position = 'fixed'; off.style.left = '-99999px';
            document.body.appendChild(off);

            const gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
            const textColor = isDarkMode ? '#9aa7b8' : '#6b7280';
            const bgColor = isDarkMode ? '#0b0f17' : '#fdfbf7';
            const xUnitLabel = currentUnit === 'Hz' ? 'Hz' : 'rad/s';

            const chart = new Chart(off.getContext('2d'), {
                type: 'line',
                data: { labels: lastFreqDisplay, datasets },
                options: {
                    // devicePixelRatio must be pinned to 1: left at its default,
                    // Chart.js multiplies the canvas by the device's screen DPR
                    // (up to 3-4x on phones), squaring the pixel count and
                    // producing enormous, poorly-compressing export images —
                    // this alone was the main cause of 100MB+ PDFs.
                    devicePixelRatio: 1,
                    responsive: false, maintainAspectRatio: false, animation: false,
                    layout: { padding: { left: 10, right: 20, top: 12, bottom: 10 } },
                    scales: {
                        x: { type: 'logarithmic', grid: { color: gridColor }, title: { display: true, text: xUnitLabel, color: textColor, font: { size: 20, weight: '600' } }, ticks: { color: textColor, maxTicksLimit: 12, font: { size: 18 }, callback: xTickCallback } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 18 } }, title: { display: true, text: yLabel, color: textColor, font: { size: 20, weight: '600' } } }
                    },
                    plugins: { legend: { display: false } }
                },
                plugins: [{
                    // JPEG has no transparency, so paint a solid background
                    // behind the chart before it's exported.
                    id: 'solidBg',
                    beforeDraw(c) {
                        const { ctx, width, height } = c;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(0, 0, width, height);
                        ctx.restore();
                    }
                }]
            });
            // JPEG at high quality is dramatically smaller than lossless PNG
            // for this kind of content (dense anti-aliased/dashed lines) and
            // is visually indistinguishable in a printed report.
            const img = chart.toBase64Image('image/jpeg', 0.92);
            chart.destroy();
            document.body.removeChild(off);
            return { img, w: FW, h: FH };
        }

        // Renders the temporal response chart off-screen at a fixed size/font
        // for the PDF, exactly like renderExportChart does for the Bode plots.
        function renderExportTemporalChart() {
            if (!lastTemporalData) return null;
            const { t: tArr, u, y } = lastTemporalData;
            const FW = 1600, FH = 720;
            const off = document.createElement('canvas');
            off.width = FW; off.height = FH;
            off.style.position = 'fixed'; off.style.left = '-99999px';
            document.body.appendChild(off);

            const gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
            const textColor = isDarkMode ? '#9aa7b8' : '#6b7280';
            const bgColor = isDarkMode ? '#0b0f17' : '#fdfbf7';
            const outputColor = isDarkMode ? '#818cf8' : '#6366f1';
            const inputColor = isDarkMode ? '#6b7280' : '#9ca3af';

            const chart = new Chart(off.getContext('2d'), {
                type: 'line',
                data: {
                    labels: tArr.map(v => v.toFixed(3)),
                    datasets: [
                        { label: t('outputLbl'), data: y, borderColor: outputColor, borderWidth: 3, tension: 0.15, pointRadius: 0 },
                        { label: t('inputLbl'), data: u, borderColor: inputColor, borderDash: [10, 10], borderWidth: 2, tension: 0, pointRadius: 0 }
                    ]
                },
                options: {
                    devicePixelRatio: 1,
                    responsive: false, maintainAspectRatio: false, animation: false,
                    layout: { padding: { left: 10, right: 20, top: 12, bottom: 10 } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 10, font: { size: 16 } }, title: { display: true, text: 't (s)', color: textColor, font: { size: 18, weight: '600' } } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 16 } } }
                    },
                    plugins: { legend: { display: true, position: 'top', align: 'end', labels: { color: textColor, boxWidth: 24, font: { size: 16 } } } }
                },
                plugins: [{
                    id: 'solidBg',
                    beforeDraw(c) {
                        const { ctx, width, height } = c;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(0, 0, width, height);
                        ctx.restore();
                    }
                }]
            });
            const img = chart.toBase64Image('image/jpeg', 0.92);
            chart.destroy();
            document.body.removeChild(off);
            return { img, w: FW, h: FH };
        }

        // Renders the Nyquist chart off-screen at a fixed size/font for the PDF.
        function renderExportNyquistChart() {
            if (!lastNyquistData) return null;
            const { posBranch, negBranch, fullBounds } = lastNyquistData;
            // Reflect whatever zoom/pan the user currently has on the live
            // chart (chartjs-plugin-zoom updates chart.scales in place), so
            // the PDF matches exactly what they were looking at — falls back
            // to the full bounding box if the live chart isn't available.
            const bounds = (nyquistChart && nyquistChart.scales && nyquistChart.scales.x && nyquistChart.scales.y)
                ? { xMin: nyquistChart.scales.x.min, xMax: nyquistChart.scales.x.max, yMin: nyquistChart.scales.y.min, yMax: nyquistChart.scales.y.max }
                : fullBounds;
            const FW = 1600, FH = 900;
            const off = document.createElement('canvas');
            off.width = FW; off.height = FH;
            off.style.position = 'fixed'; off.style.left = '-99999px';
            document.body.appendChild(off);

            const gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
            const textColor = isDarkMode ? '#9aa7b8' : '#6b7280';
            const bgColor = isDarkMode ? '#0b0f17' : '#fdfbf7';
            const curveColor = isDarkMode ? '#818cf8' : '#6366f1';
            const mirrorColor = isDarkMode ? '#6b7280' : '#9ca3af';
            const criticalColor = isDarkMode ? '#f87171' : '#dc2626';
            const mCircleColor = isDarkMode ? '#4b5563' : '#d1d5db';
            const nCircleColor = isDarkMode ? '#5b4b6b' : '#e0d1f0';

            const exportDatasets = [
                { data: posBranch, borderColor: curveColor, borderWidth: 3, pointRadius: 0, showLine: true, tension: 0 },
                { data: negBranch, borderColor: mirrorColor, borderDash: [10, 10], borderWidth: 2, pointRadius: 0, showLine: true, tension: 0 },
                { data: [{ x: -1, y: 0 }], borderColor: criticalColor, backgroundColor: criticalColor, pointRadius: 9, pointStyle: 'crossRot', pointBorderWidth: 4, showLine: false }
            ];
            if (hallChartOn) {
                [-6, -3, 0, 3, 6].forEach(db => {
                    const M = Math.pow(10, db / 20);
                    exportDatasets.push({ data: buildMCircle(M, 120), borderColor: mCircleColor, borderWidth: 1.5, borderDash: [3, 4], pointRadius: 0, showLine: true, tension: 0 });
                });
                [-10, -20, -30, -60, -90, -120, -150].forEach(deg => {
                    exportDatasets.push({ data: buildNCircle(deg, 120), borderColor: nCircleColor, borderWidth: 1.5, borderDash: [1, 4], pointRadius: 0, showLine: true, tension: 0 });
                });
            }

            const chart = new Chart(off.getContext('2d'), {
                type: 'line',
                data: { datasets: exportDatasets },
                options: {
                    devicePixelRatio: 1,
                    responsive: false, maintainAspectRatio: false, animation: false,
                    layout: { padding: { left: 10, right: 20, top: 12, bottom: 10 } },
                    scales: {
                        x: { type: 'linear', min: bounds.xMin, max: bounds.xMax, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 16 } }, title: { display: true, text: 'Re', color: textColor, font: { size: 18, weight: '600' } } },
                        y: { type: 'linear', min: bounds.yMin, max: bounds.yMax, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 16 } }, title: { display: true, text: 'Im', color: textColor, font: { size: 18, weight: '600' } } }
                    },
                    plugins: { legend: { display: false } }
                },
                plugins: [{
                    id: 'solidBg',
                    beforeDraw(c) {
                        const { ctx, width, height } = c;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(0, 0, width, height);
                        ctx.restore();
                    }
                }]
            });
            const img = chart.toBase64Image('image/jpeg', 0.92);
            chart.destroy();
            document.body.removeChild(off);
            return { img, w: FW, h: FH };
        }

        function renderExportNicholsChart() {
            if (!lastNicholsData) return null;
            const { points } = lastNicholsData;
            const FW2 = 1600, FH2 = 900;
            const off2 = document.createElement('canvas');
            off2.width = FW2; off2.height = FH2;
            off2.style.position = 'fixed'; off2.style.left = '-99999px';
            document.body.appendChild(off2);

            const gridColor2 = isDarkMode ? '#2a3441' : '#e5e7eb';
            const textColor2 = isDarkMode ? '#9aa7b8' : '#6b7280';
            const bgColor2 = isDarkMode ? '#0b0f17' : '#fdfbf7';
            const curveColor2 = isDarkMode ? '#818cf8' : '#6366f1';
            const criticalColor2 = isDarkMode ? '#f87171' : '#dc2626';

            const xScale2 = { type: 'linear', grid: { color: gridColor2 }, ticks: { color: textColor2, font: { size: 16 } }, title: { display: true, text: 'Fase (°)', color: textColor2, font: { size: 18, weight: '600' } } };
            const yScale2 = { type: 'linear', grid: { color: gridColor2 }, ticks: { color: textColor2, font: { size: 16 } }, title: { display: true, text: 'Modulo (dB)', color: textColor2, font: { size: 18, weight: '600' } } };

            const chart2 = new Chart(off2.getContext('2d'), {
                type: 'line',
                data: {
                    datasets: [
                        { data: points, borderColor: curveColor2, borderWidth: 3, pointRadius: 0, showLine: true, tension: 0 },
                        { data: [{ x: -180, y: 0 }], borderColor: criticalColor2, backgroundColor: criticalColor2, pointRadius: 9, pointStyle: 'crossRot', pointBorderWidth: 4, showLine: false }
                    ]
                },
                options: {
                    devicePixelRatio: 1,
                    responsive: false, maintainAspectRatio: false, animation: false,
                    layout: { padding: { left: 10, right: 20, top: 12, bottom: 10 } },
                    scales: { x: xScale2, y: yScale2 },
                    plugins: { legend: { display: false } }
                },
                plugins: [{
                    id: 'solidBg',
                    beforeDraw(c) {
                        const { ctx, width, height } = c;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = bgColor2;
                        ctx.fillRect(0, 0, width, height);
                        ctx.restore();
                    }
                }]
            });
            const img2 = chart2.toBase64Image('image/jpeg', 0.92);
            chart2.destroy();
            document.body.removeChild(off2);
            return { img: img2, w: FW2, h: FH2 };
        }

        // Builds and downloads a clean PDF report (formula, the 3 data cards, both charts) using jsPDF directly, without screenshotting the page.
        function downloadPDF() {
            const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (!jsPDFCtor) { console.error('jsPDF non disponibile'); return; }

            const doc = new jsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const marginX = 15;
            const usableW = pageW - marginX * 2;
            let y = 28;

            const textDark = [28, 25, 23], textGray = [107, 114, 128], ruleGray = [225, 220, 210], accent = [30, 58, 138];
            const setC = c => doc.setTextColor(c[0], c[1], c[2]);
            const setD = c => doc.setDrawColor(c[0], c[1], c[2]);

            // Adds a new PDF page if the next block of content wouldn't fit on the remainder of the current one.
            function ensureSpace(h) { if (y + h > pageH - 15) { doc.addPage(); y = 28; } }

            // jsPDF's built-in fonts only cover the Latin-1 (WinAnsi) character
            // set; glyphs like 𝜔, ∞, ≈ render broken — swap in safe equivalents.
            // Strips or replaces characters not supported by jsPDF's standard Latin-1 font (e.g. 𝜔, ∞, ≈), which would otherwise render as broken glyphs.
            function pdfSafe(str) {
                if (!str) return str;
                return String(str).replace(/𝜔/g, 'w').replace(/ω/g, 'w').replace(/∞/g, 'inf').replace(/≈/g, '~').replace(/[^\x00-\xFF]/g, '');
            }
            // Reads and PDF-sanitizes the text content of a DOM element, for use in the PDF report.
            function getText(id) {
                const el = document.getElementById(id);
                return pdfSafe(el ? el.textContent.trim() : '');
            }
            // Title + thin rule, shared by the data cards and the chart blocks.
            // Draws a section title followed by a thin divider rule — the shared header style for both the data cards and the chart blocks in the PDF.
            function sectionHeader(title, color, size) {
                doc.setFont('helvetica', 'bold'); doc.setFontSize(size); setC(color);
                doc.text(title.toUpperCase(), marginX, y + 3);
                setD(ruleGray); doc.setLineWidth(0.2);
                doc.line(marginX, y + 6, marginX + usableW, y + 6);
            }

            // ── Header ───────────────────────────────────────────────
            doc.setFont('helvetica', 'bold'); doc.setFontSize(17); setC(textDark);
            doc.text('Easy Bode - Analisi di Bode', marginX, y);
            y += 11;

            // ── Formula G(s) — drawn as real vector text, exponents as true
            //    raised/smaller glyphs (unicode superscripts past ¹²³ are
            //    missing from jsPDF's standard font) ─────────────────────
            const exprStr = document.getElementById('tfInput').value || '';
            let numStr = '1', denStr = '1';
            if (exprStr.indexOf('/') !== -1) {
                const parts = exprStr.split('/');
                numStr = parts[0] || '1'; denStr = parts[1] || '1';
            } else if (exprStr.trim() !== '') { numStr = exprStr; denStr = '1'; }

            const cleanExpr = str => str.trim().replace(/\*/g, '');
            // Splits an expression string into normal-text and superscript (exponent) segments, for rendering true vector superscripts in the PDF.
            function parseExprSegments(str) {
                const segments = []; const re = /\^(-?\d+)/g; let lastIndex = 0, m;
                while ((m = re.exec(str)) !== null) {
                    if (m.index > lastIndex) segments.push({ text: str.slice(lastIndex, m.index), sup: false });
                    segments.push({ text: m[1], sup: true });
                    lastIndex = re.lastIndex;
                }
                if (lastIndex < str.length) segments.push({ text: str.slice(lastIndex), sup: false });
                return segments;
            }
            // Measures the total rendered width of an expression in the PDF, accounting for the smaller size of superscript segments.
            function measureExpr(str, fontSize) {
                let w = 0;
                parseExprSegments(str).forEach(seg => {
                    doc.setFont('times', 'italic'); doc.setFontSize(seg.sup ? fontSize * 0.62 : fontSize);
                    w += doc.getTextWidth(seg.text);
                });
                return w;
            }
            // Draws an expression horizontally centered on a point, rendering exponents as true raised/smaller vector text instead of unicode superscript characters.
            function drawExprCentered(str, centerX, baselineY, fontSize) {
                const segments = parseExprSegments(str);
                let cursorX = centerX - measureExpr(str, fontSize) / 2;
                segments.forEach(seg => {
                    doc.setFont('times', 'italic'); doc.setFontSize(seg.sup ? fontSize * 0.62 : fontSize);
                    doc.text(seg.text, cursorX, seg.sup ? baselineY - fontSize * 0.30 * 0.3528 : baselineY);
                    cursorX += doc.getTextWidth(seg.text);
                });
            }
            numStr = cleanExpr(numStr); denStr = cleanExpr(denStr);

            const formulaFontSize = 15, fsMm = formulaFontSize * 0.3528;
            // Vertical gap from the bar to each baseline, sized to the font's
            // approximate ascent/descent so glyphs never cross the bar line.
            const numGap = fsMm * 0.45, denGap = fsMm * 1.00;
            const topClearance = fsMm * 0.85, bottomClearance = fsMm * 0.35;
            const formulaH = numGap + topClearance + denGap + bottomClearance;
            ensureSpace(formulaH + 10);

            doc.setFont('helvetica', 'normal'); doc.setFontSize(11); setC(textGray);
            const barY = y + topClearance + numGap;
            doc.text('G(s) =', marginX, barY, { baseline: 'middle' });

            const fracCenterX = marginX + 26 + Math.max(measureExpr(numStr, formulaFontSize), measureExpr(denStr, formulaFontSize)) / 2;
            const barHalf = Math.max(measureExpr(numStr, formulaFontSize), measureExpr(denStr, formulaFontSize)) / 2 + 2.5;
            setC(textDark);
            drawExprCentered(numStr, fracCenterX, barY - numGap, formulaFontSize);
            setD(textDark); doc.setLineWidth(0.35);
            doc.line(fracCenterX - barHalf, barY, fracCenterX + barHalf, barY);
            drawExprCentered(denStr, fracCenterX, barY + denGap, formulaFontSize);
            y += formulaH + 10;

            // ── The 3 data cards (values read straight from the computed UI) ─
            // Minimal design: no boxes — a title, a thin rule, and the rows.
            const cardDefs = [
                { title: 'lbl-w2-title', rows: [['lbl-static-gain', 'val-static-gain'], ['lbl-sys-type', 'val-sys-type'], ['lbl-sys-order', 'val-sys-order'], ['lbl-extracted-zeros-title', 'val-extracted-zeros'], ['lbl-extracted-poles-title', 'val-extracted-poles']] },
                { title: 'lbl-w1-title', rows: [['lbl-pm', 'val-pm'], ['lbl-wc', 'val-wc'], ['lbl-gm', 'val-gm'], ['lbl-w180', 'val-w180'], ['lbl-cl-stability', 'val-cl-stability']] },
                { title: 'lbl-w3-title', rows: [['lbl-resonance-peak', 'val-resonance-peak'], ['lbl-slope-init', 'val-slope-init'], ['lbl-slope-final', 'val-slope-final'], ['lbl-bandwidth', 'val-bandwidth'], ['lbl-filter-behavior', 'val-filter-behavior']] }
            ];
            cardDefs.forEach(card => {
                const rowH = 6.4, cardH = 9 + card.rows.length * rowH;
                ensureSpace(cardH + 8);
                sectionHeader(getText(card.title), accent, 10.5);
                let ry = y + 13;
                card.rows.forEach(([labelId, valueId]) => {
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setC(textGray);
                    doc.text(getText(labelId), marginX, ry);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setC(textDark);
                    doc.text(getText(valueId) || '--', marginX + usableW, ry, { align: 'right' });
                    ry += rowH;
                });
                y += cardH + 8;
            });

            // ── The 2 charts, rendered off-screen at a fixed size so the ─
            // PDF looks identical regardless of the device used to make it.
            // Adds one chart's title, divider rule and exported image to the PDF, starting a new page first if it wouldn't fit.
            function addChartImage(datasets, yLabel, titleId) {
                if (!datasets.length || !lastFreqDisplay.length) return;
                const { img, w, h } = renderExportChart(datasets, yLabel);
                const drawW = usableW, drawH = drawW * (h / w);
                ensureSpace(drawH + 16);
                sectionHeader(getText(titleId), textGray, 10);
                y += 10;
                doc.addImage(img, 'JPEG', marginX, y, drawW, drawH);
                y += drawH + 20;
            }
            // The PDF always shows the transfer function's real AND
            // asymptotic behavior together, regardless of whichever layers
            // happen to be toggled on live at export time.
            const pdfLayers = { real: true, asymptotic: true, contributions: false };
            const { datasetsMag, datasetsPhase } = buildChartDatasets(lastMagData, lastPhaseData, lastAsympMagData, lastAsympPhaseData, lastContributionCurves, pdfLayers, pdfLayers);
            addChartImage(datasetsMag, 'dB', 'title-mag');
            addChartImage(datasetsPhase, '°', 'title-phase');

            // ── Mini pole/zero contribution charts (magnitude + phase, ──
            // real + asymptotic, side by side) — one pair per pole/zero.
            function renderExportMiniChart(dataReal, dataAsymp, color, isLogX, yUnit) {
                const FW = 700, FH = 480;
                const off = document.createElement('canvas');
                off.width = FW; off.height = FH;
                off.style.position = 'fixed'; off.style.left = '-99999px';
                document.body.appendChild(off);
                const gridColor = isDarkMode ? '#2a3441' : '#e5e7eb';
                const textColor = isDarkMode ? '#9aa7b8' : '#6b7280';
                const bgColor = isDarkMode ? '#0b0f17' : '#fdfbf7';
                const xUnitLabel = currentUnit === 'Hz' ? 'Hz' : 'rad/s';
                const chart = new Chart(off.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: lastFreqDisplay,
                        datasets: [
                            { data: dataReal, borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.4 },
                            { data: dataAsymp, borderColor: color, borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0, tension: 0 }
                        ]
                    },
                    options: {
                        devicePixelRatio: 1, responsive: false, maintainAspectRatio: false, animation: false,
                        layout: { padding: { left: 8, right: 10, top: 8, bottom: 8 } },
                        scales: {
                            x: { type: isLogX ? 'logarithmic' : 'linear', grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 6, font: { size: 11 }, callback: isLogX ? xTickCallback : undefined }, title: { display: true, text: xUnitLabel, color: textColor, font: { size: 12, weight: '600' } } },
                            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, title: { display: true, text: yUnit, color: textColor, font: { size: 12, weight: '600' } } }
                        },
                        plugins: { legend: { display: false } }
                    },
                    plugins: [{
                        id: 'solidBg',
                        beforeDraw(c) {
                            const { ctx, width, height } = c;
                            ctx.save(); ctx.globalCompositeOperation = 'destination-over';
                            ctx.fillStyle = bgColor; ctx.fillRect(0, 0, width, height); ctx.restore();
                        }
                    }]
                });
                const img = chart.toBase64Image('image/jpeg', 0.9);
                chart.destroy();
                document.body.removeChild(off);
                return { img, w: FW, h: FH };
            }
            const contribList = (lastContributionCurves || []).filter(c => c.id !== 'gain-k');
            if (contribList.length && lastFreqDisplay.length) {
                ensureSpace(16);
                sectionHeader(pdfSafe(t('contrib')), textGray, 10);
                y += 10;
                const gap = 6;
                const colW = (usableW - gap) / 2;
                contribList.forEach(c => {
                    const magImg = renderExportMiniChart(c.dataMag, c.dataMagAsymp, c.color, true, 'dB');
                    const phaseImg = renderExportMiniChart(c.dataPhase, c.dataPhaseAsymp, c.color, true, '°');
                    const rowH = colW * (magImg.h / magImg.w);
                    ensureSpace(rowH + 14);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setC(textDark);
                    doc.text(c.label, marginX, y);
                    y += 4;
                    doc.addImage(magImg.img, 'JPEG', marginX, y, colW, rowH);
                    doc.addImage(phaseImg.img, 'JPEG', marginX + colW + gap, y, colW, rowH);
                    y += rowH + 8;
                });
            }

            // ── Temporal response chart + KPI table ──────────────────────
            if (lastTemporalData) {
                const exp = renderExportTemporalChart();
                if (exp) {
                    const drawW = usableW, drawH = drawW * (exp.h / exp.w);
                    ensureSpace(drawH + 16);
                    sectionHeader(getText('lbl-temporal-title'), textGray, 10);
                    y += 10;
                    doc.addImage(exp.img, 'JPEG', marginX, y, drawW, drawH);
                    y += drawH + 12;
                }

                const kpiRows = [
                    ['lbl-overshoot', 'val-overshoot'],
                    ['lbl-yss', 'val-yss'],
                    ['lbl-ess', 'val-ess'],
                    ['lbl-tr', 'val-tr'],
                    ['lbl-ts', 'val-ts']
                ];
                const kpiRowH = 6.4, kpiCardH = 9 + kpiRows.length * kpiRowH;
                ensureSpace(kpiCardH + 8);
                sectionHeader(getText('lbl-temporal-title') + ' — KPI', accent, 10.5);
                let kpiRy = y + 13;
                kpiRows.forEach(([labelId, valueId]) => {
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setC(textGray);
                    doc.text(getText(labelId), marginX, kpiRy);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setC(textDark);
                    doc.text(getText(valueId) || '--', marginX + usableW, kpiRy, { align: 'right' });
                    kpiRy += kpiRowH;
                });
                y += kpiCardH + 8;
            }

            // ── Nyquist diagram + parameters ─────────────────────────────
            if (lastNyquistData) {
                const nyqExp = renderExportNyquistChart();
                if (nyqExp) {
                    const drawW = usableW, drawH = drawW * (nyqExp.h / nyqExp.w);
                    ensureSpace(drawH + 16);
                    sectionHeader(getText('lbl-nyquist-title'), textGray, 10);
                    y += 10;
                    doc.addImage(nyqExp.img, 'JPEG', marginX, y, drawW, drawH);
                    y += drawH + 12;
                }

                const nyqRows = [
                    ['lbl-nyquist-stability', 'val-nyquist-stability'],
                    ['lbl-nyquist-p', 'val-nyquist-p'],
                    ['lbl-nyquist-n', 'val-nyquist-n'],
                    ['lbl-nyquist-z', 'val-nyquist-z'],
                    ['lbl-nyquist-dist', 'val-nyquist-dist']
                ];
                const nyqRowH = 6.4, nyqCardH = 9 + nyqRows.length * nyqRowH;
                ensureSpace(nyqCardH + 8);
                sectionHeader(getText('lbl-nyquist-title'), accent, 10.5);
                let nyqRy = y + 13;
                nyqRows.forEach(([labelId, valueId]) => {
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setC(textGray);
                    doc.text(getText(labelId), marginX, nyqRy);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setC(textDark);
                    doc.text(getText(valueId) || '--', marginX + usableW, nyqRy, { align: 'right' });
                    nyqRy += nyqRowH;
                });
                y += nyqCardH + 8;
            }

            // ── Nichols diagram + parameters ─────────────────────────────
            if (lastNicholsData) {
                const nicExp = renderExportNicholsChart();
                if (nicExp) {
                    const drawW = usableW, drawH = drawW * (nicExp.h / nicExp.w);
                    ensureSpace(drawH + 16);
                    sectionHeader(getText('lbl-nichols-title'), textGray, 10);
                    y += 10;
                    doc.addImage(nicExp.img, 'JPEG', marginX, y, drawW, drawH);
                    y += drawH + 12;
                }

                const nicRows = [
                    ['lbl-nichols-pm', 'val-nichols-pm'],
                    ['lbl-nichols-gm', 'val-nichols-gm'],
                    ['lbl-nichols-wc', 'val-nichols-wc'],
                    ['lbl-nichols-w180', 'val-nichols-w180']
                ];
                const nicRowH = 6.4, nicCardH = 9 + nicRows.length * nicRowH;
                ensureSpace(nicCardH + 8);
                sectionHeader(getText('lbl-nichols-title'), accent, 10.5);
                let nicRy = y + 13;
                nicRows.forEach(([labelId, valueId]) => {
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setC(textGray);
                    doc.text(getText(labelId), marginX, nicRy);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); setC(textDark);
                    doc.text(getText(valueId) || '--', marginX + usableW, nicRy, { align: 'right' });
                    nicRy += nicRowH;
                });
                y += nicCardH + 8;
            }

            doc.save('Bode_Analysis.pdf');
        }
    