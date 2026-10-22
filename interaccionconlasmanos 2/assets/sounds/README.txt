Assets de sonido para el proyecto Mariposa de Manos.

Este proyecto usa p5.PolySynth (síntesis de audio) para el piano, por lo que
NO requiere archivos de audio (WAV/MP3) para funcionar. La melodía de notas al
azar se genera en tiempo real con p5.Sound.

Si en el futuro quieres reemplazar la síntesis por samples de piano reales,
colócalos aquí y actualiza sketch.js para cargarlos con loadSound() en preload().