from langchain_core.tools import tool
from agent.model import model
from agent.graph_state import GraphState
from agent.date_parser import DateParser

@tool
def add(num1: int, num2: int):
  """This is an addition function that adds two numbers together."""
  return num1 + num2

@tool
def subtract(num1: int, num2: int):
  """This is an subtraction function that subtracts two numbers together."""
  return num1 - num2

@tool
def calculate_date(date_info:str):
  """This is a date calculating function that parse date information to date"""
  parser=DateParser()
  result = parser.parse(date_info)
  return f'appointment date: {parser.format_result(result)}'

@tool
def cancel_doctor_appointment(patient_id: str, doctor_name: str, patient_name:str):
  """This is a doctor appointment canceling function"""
  return f'Dr. {doctor_name} Booking cancel for patient {patient_name}'

@tool
def doctor_appointment(patient_id: str, doctor_name: str, appointment_date:str, patient_name:str, patient_age:int):
  """This is a doctor appointment booking function"""
  return f'{patient_id} Your appointment with Dr. {doctor_name} on {appointment_date} is confirmed.'

tools=[cancel_doctor_appointment,doctor_appointment, calculate_date]

tools_model = model.bind_tools(tools)

def model_call(state: GraphState):
  print(state['messages'][-1])
  response=tools_model.invoke([
    ('system','You are my AI assistant, please answer my query to the best of your ability. before calling doctor_appointment tool we need to take user confirmation showing all inputs.')    
  ]+state['messages'])
  state['messages']=[response]
  return state

def should_continue(state:GraphState):
  messages=state['messages']
  last_message = messages[-1]

  if not last_message.tool_calls:
    return 'end'
  return 'continue'




