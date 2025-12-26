export const HARMONY_CONFIG = {
    // Tamanho do buffer de histórico de notas (eventos NoteOn)
    HISTORY_SIZE: 12,
    
    // Peso para notas físicas (que estão sendo pressionadas agora)
    WEIGHT_PHYSICAL: 2.0,
    
    // Peso para notas recentes no histórico
    WEIGHT_RECENT: 1.5,
    
    // Peso para notas antigas no histórico
    WEIGHT_OLD: 0.5,
    
    // Ponto de corte para considerar uma nota "antiga" (índice no array, 0 é o mais antigo)
    // Se HISTORY_SIZE é 12, índices 0-5 são antigos, 6-11 são recentes
    RECENT_THRESHOLD_INDEX: 6,

    // Tempo máximo (ms) para considerar um evento no histórico válido
    // Mesmo com buffer de eventos, não queremos notas de 10 segundos atrás influenciando o acorde atual
    MAX_HISTORY_AGE_MS: 2000,

    // Tempo para manter o acorde soando após soltar todas as notas (em ms)
    // Isso evita que o som corte abruptamente quando o músico tira a mão do teclado
    SUSTAIN_WITHOUT_NOTES_MS: 10000,
};

export const AUDIO_CONFIG = {
    // Configurações padrão do sintetizador
    DEFAULT_FILTER_CUTOFF: 1200,
    DEFAULT_FILTER_RES: 0,
    DEFAULT_ATTACK: 0.8,
    DEFAULT_RELEASE: 1.5,
    DEFAULT_REVERB_MIX: 0.3,
    DEFAULT_DELAY_MIX: 0.2,
};
