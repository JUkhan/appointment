from google import genai
from google.genai import types
import wave
from dotenv import load_dotenv
load_dotenv()

# Set up the wave file to save the output:
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)



def gen_audio_file(filename: str, text: str):
    client = genai.Client()
    response = client.models.generate_content(
    model="gemini-2.5-flash-preview-tts",
    contents=text,
    config=types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name='Kore',
                )
            )
        ),
    )
    )

    data = response.candidates[0].content.parts[0].inline_data.data
    
    wave_file(filename, data) # Saves the file to current directory

if __name__ == '__main__':
   bengali_text = """
আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।
নমস্কার! আমি একটি কৃত্রিম বুদ্ধিমত্তা সহায়ক।
আমি বাংলা ভাষায় কথা বলতে পারি।
আপনাকে সাহায্য করতে পেরে আমি খুশি।
"""
   gen_audio_file("test.wav",bengali_text)