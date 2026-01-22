
from langchain.chat_models import init_chat_model
# LLM
model = init_chat_model(model="gemini-2.5-flash", temperature=0, model_provider='google_genai')