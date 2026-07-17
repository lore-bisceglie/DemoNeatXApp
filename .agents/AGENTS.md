# Regole e Memoria del Progetto NeatX

## Decisioni Architetturali: Generazione Vocale (TTS)
- **Motore Attuale:** Il bot utilizza attualmente `edge-tts` (voce `it-IT-DiegoNeural`) come fallback gratuito a ElevenLabs. Edge-TTS fornisce un audio di eccellente qualità per la lingua italiana ed è velocissimo, non consumando Compute eccessivo sulle istanze cloud/Neon.
- **Alternativa Futura (Kokoro TTS):** Tenere a mente il progetto open-source **Kokoro TTS** (basato su Transformers.js / PyTorch). Attualmente *non* è stato implementato perché le voci italiane sono inferiori a quelle di Microsoft e l'esecuzione locale su GitHub Actions aumenterebbe drasticamente i costi di compute di Neon (rallentando i task). Tuttavia, va riconsiderato in futuro se:
  1. La qualità delle voci italiane di Kokoro dovesse raggiungere quella di Microsoft.
  2. Il progetto dovesse espandersi al mercato anglofono (dove Kokoro eccelle in qualità).
  3. Edge-TTS dovesse smettere di funzionare o imporre limiti API.
