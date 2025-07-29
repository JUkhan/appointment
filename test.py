from dotenv import load_dotenv

load_dotenv()
from agent.app import run_chatbot

if __name__ == '__main__':
  print(run_chatbot('add 3+5', '123'))