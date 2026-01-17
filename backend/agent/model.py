
from langchain.chat_models import init_chat_model
# LLM
model = init_chat_model(model="gemini-3-flash-preview", temperature=0, model_provider='google_genai')