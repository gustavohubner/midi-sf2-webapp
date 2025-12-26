import { detectChord } from './chord-detection';
import { HARMONY_CONFIG } from './constants';

export class HarmonyEngine {
    constructor() {
        this.physicalNotes = new Set(); // Notas que estão sendo pressionadas AGORA
        this.noteHistory = []; // Histórico sequencial de eventos: { note, timestamp, velocity, type: 'on' }
        this.lastStableChord = null;
        this.lastActiveTime = Date.now();
        
        // Configuração dinâmica
        this.config = {
            historySize: HARMONY_CONFIG.HISTORY_SIZE,
            sustainTime: HARMONY_CONFIG.SUSTAIN_WITHOUT_NOTES_MS,
            allowedQualities: null // null = todas
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Chamado quando uma tecla é pressionada
    noteOn(note, velocity) {
        this.physicalNotes.add(note);
        
        // Adiciona ao histórico
        this.addToHistory({
            note: note,
            timestamp: Date.now(),
            velocity: velocity,
            type: 'on'
        });
    }

    // Chamado quando uma tecla é solta
    noteOff(note) {
        this.physicalNotes.delete(note);
    }

    addToHistory(event) {
        // Se o último evento foi há muito tempo (gap > MAX_HISTORY_AGE), 
        // assumimos que é uma nova frase musical e limpamos o histórico antigo.
        // Isso evita misturar acordes de momentos muito distintos.
        const lastEvent = this.noteHistory[this.noteHistory.length - 1];
        if (lastEvent && (event.timestamp - lastEvent.timestamp > HARMONY_CONFIG.MAX_HISTORY_AGE_MS)) {
            this.noteHistory = [];
        }

        this.noteHistory.push(event);
        // Mantém apenas os últimos X eventos definidos na config
        if (this.noteHistory.length > this.config.historySize) {
            this.noteHistory.shift();
        }
    }

    // O "Cérebro" que decide qual acorde tocar
    getHarmonicState() {
        // Removido cleanupOldEvents() para evitar que o acorde mude sozinho com o tempo.
        // A limpeza agora acontece apenas na entrada de novas notas (addToHistory) ou por limite de tamanho.

        // UNIFICAÇÃO DA LÓGICA:
        // Removemos a distinção entre "notas físicas" e "histórico".
        // Agora, o sistema confia 100% no algoritmo de Cluster Competition (analyzeHistoryClusters).
        // Como o analyzeHistoryClusters já inclui as physicalNotes na análise, não perdemos nada.
        // Isso garante que o acorde detectado enquanto você segura as teclas seja O MESMO
        // que o sistema detecta milissegundos depois de você soltar (evitando trocas fantasmas).

        let result = null;
        
        const clusterResult = this.analyzeHistoryClusters();
        if (clusterResult.chord) {
            result = clusterResult;
        }

        // Lógica de Atualização e Sustain
        if (result) {
            // Encontramos um acorde válido agora
            this.lastStableChord = result;
            this.lastActiveTime = Date.now();
            return result;
        } else {
            // Não encontramos nada agora. Devemos sustentar o anterior?
            const timeSinceLastActive = Date.now() - this.lastActiveTime;
            
            // Se ainda estamos dentro do tempo de sustain definido na config
            if (this.lastStableChord && timeSinceLastActive < this.config.sustainTime) {
                return {
                    ...this.lastStableChord,
                    source: 'sustain_hold'
                };
            }
        }

        return { chord: null, notes: [] };
    }

    analyzeHistoryClusters() {
        if (this.noteHistory.length === 0 && this.physicalNotes.size === 0) {
            return { chord: null, notes: [] };
        }

        // Vamos testar diferentes tamanhos de cluster, do mais recente para o mais antigo
        // Ex: Últimas 3 notas, Últimas 4, ..., Últimas N
        let bestCandidate = null;
        let maxScore = -1;

        // Mínimo de 3 notas para formar um acorde
        const minClusterSize = 3;
        const maxClusterSize = this.noteHistory.length;

        for (let size = minClusterSize; size <= maxClusterSize; size++) {
            // Pega os últimos 'size' eventos
            const clusterEvents = this.noteHistory.slice(-size);
            
            // Extrai as notas únicas desse cluster
            const uniqueNotes = new Set();
            
            // Adiciona notas físicas atuais (sempre relevantes)
            this.physicalNotes.forEach(n => uniqueNotes.add(n));
            
            // Adiciona notas do cluster
            clusterEvents.forEach(e => uniqueNotes.add(e.note));

            const notesArray = Array.from(uniqueNotes).sort((a, b) => a - b);
            
            // Tenta detectar acorde
            const chordName = detectChord(notesArray, this.config.allowedQualities);

            if (chordName && chordName !== "Unknown" && chordName !== "...") {
                // Calcula pontuação para este candidato
                const score = this.calculateScore(clusterEvents, chordName, notesArray);
                
                if (score > maxScore) {
                    maxScore = score;
                    bestCandidate = {
                        chord: chordName,
                        notes: notesArray,
                        source: 'history_cluster',
                        size: size
                    };
                }
            }
        }

        return bestCandidate || { chord: null, notes: [] };
    }

    calculateScore(events, chordName, notesArray) {
        let score = 0;
        
        // Use o timestamp do último evento do histórico global como referência
        // Isso congela a pontuação quando o usuário para de tocar, evitando trocas fantasmas
        const lastHistoryEvent = this.noteHistory[this.noteHistory.length - 1];
        const referenceTime = lastHistoryEvent ? lastHistoryEvent.timestamp : Date.now();

        // 1. Pontuação por Recência e Quantidade
        // Notas mais recentes valem MUITO mais
        events.forEach((event, index) => {
            // Calcula a "idade" do evento em relação ao cluster
            // index 0 é o mais antigo do cluster, events.length-1 é o mais recente
            
            // Peso linear baseado na posição no cluster (0.5 a 1.5)
            const positionWeight = 0.5 + (index / events.length);
            
            // Peso extra se for MUITO recente em relação à última nota tocada (< 500ms)
            const isVeryRecent = (referenceTime - event.timestamp) < 500;
            const recentBonus = isVeryRecent ? 2.0 : 0;

            score += (1 * positionWeight) + recentBonus;
        });

        // Bônus CRÍTICO: Se o acorde detectado NÃO contém a nota mais recente tocada,
        // ele provavelmente é um "fantasma" do passado.
        // IMPORTANTE: Usamos lastHistoryEvent (global) e não events (cluster local)
        if (lastHistoryEvent) {
            // Verifica se a nota do último evento GLOBAL faz parte das notas do acorde detectado
            if (notesArray.includes(lastHistoryEvent.note)) {
                score += 10.0; // Bônus massivo para acordes que respeitam a última nota
            } else {
                score -= 20.0; // Penalidade severa para acordes que ignoram a última nota
            }
        }

        // 2. Complexidade do Acorde
        // Preferência por Tétrades (7M, m7) sobre Tríades simples se detectado
        // (Isso ajuda a não simplificar demais se o usuário tocou a sétima)
        if (chordName.includes("7") || chordName.includes("9")) {
            score += 0.5;
        }

        // 3. Estabilidade do Baixo
        // Se a nota mais grave do cluster é a tônica do acorde detectado, ganha pontos
        // (Isso requer parsing do nome do acorde, ex: "Cm7" -> Tônica C)
        // Vamos fazer uma verificação simples baseada na primeira letra
        const rootNoteMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
        const rootChar = chordName.charAt(0); // Ex: "C" de "Cm7"
        const hasSharp = chordName.length > 1 && chordName.charAt(1) === '#';
        let rootPitch = rootNoteMap[rootChar];
        if (hasSharp) rootPitch = (rootPitch + 1) % 12;

        const bassNote = notesArray[0];
        const bassPitch = bassNote % 12;

        if (bassPitch === rootPitch) {
            score += 2.0; // Bônus alto para acorde na posição fundamental
        } else {
            // Inversão (Slash Chord)
            // Se o detector identificou corretamente a inversão (ex: C/E), ok.
            // Mas se o baixo físico não bate com a tônica, pode ser transição.
        }

        return score;
    }
    
    // Método para resetar tudo (Panic button)
    reset() {
        this.physicalNotes.clear();
        this.noteHistory = [];
    }
}
