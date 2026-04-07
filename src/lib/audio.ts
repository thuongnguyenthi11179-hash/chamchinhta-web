/**
 * Plays raw PCM audio data from Gemini TTS
 * @param base64Data The base64 encoded PCM data
 * @param sampleRate The sample rate (default 24000 for Gemini TTS)
 */
export async function playPCM(base64Data: string, sampleRate: number = 24000) {
  try {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    const audioContext = new AudioContextClass();
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Convert base64 to ArrayBuffer
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Gemini TTS returns 16-bit PCM (Int16)
    // Ensure we have an even number of bytes for Int16
    const bufferLength = Math.floor(len / 2);
    const int16Data = new Int16Array(bytes.buffer, 0, bufferLength);
    const float32Data = new Float32Array(bufferLength);
    
    // Normalize Int16 to Float32 [-1.0, 1.0]
    for (let i = 0; i < bufferLength; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }
    
    const audioBuffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    return { source, audioContext };
  } catch (error) {
    console.error("Error playing PCM audio:", error);
    return null;
  }
}
