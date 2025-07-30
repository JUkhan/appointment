from langchain_core.tools import tool
from agent.model import model
from agent.graph_state import GraphState
import dateparser
from service import book_appointment, cancel_appointment, get_doctor_list, get_user_appointments
from agent.is_date_in_schedule import is_date_in_schedule

@tool
def is_appointment_date_in_schedule(appointment_date: str, doctor_availability:str):
  """This is a week day checking function"""
  return is_date_in_schedule(dateparser.parse(appointment_date).strftime('%a, %B %d, %Y'), doctor_availability)

@tool
def doctor_list():
  """This is a doctor list function that shows all doctors details."""
  return get_doctor_list()

@tool
def calculate_date(date_info:str):
  """This is a date calculating function that parse date information to date"""
  return f'appointment_date: {dateparser.parse(date_info).strftime('%a, %B %d, %Y')}'

@tool
def cancel_doctor_appointment(appointment_id: str, user_id: str):
  """This is a doctor appointment canceling function"""
  return cancel_appointment(appointment_id, user_id)

@tool
def doctor_appointment(user_id: str, doctor_id: str, doctor_name: str, appointment_date:str, patient_name:str, patient_age:int):
  """This is a doctor appointment booking function"""
  return book_appointment(user_id=user_id, doctor_id=doctor_id, date=appointment_date, patient_name=patient_name, patient_age=patient_age)

tools=[cancel_doctor_appointment,doctor_appointment, calculate_date, doctor_list, is_appointment_date_in_schedule]

tools_model = model.bind_tools(tools)

def model_call(state: GraphState):
  print(state['messages'][-1])
  response=tools_model.invoke([
    ('system','You are my AI assistant, please answer my query to the best of your ability. use doctor_list tool get doctor detail. before calling doctor_appointment tool we need to take user confirmation showing all inputs.')    
  ]+state['messages'])
  state['messages']=[response]
  return state

def should_continue(state:GraphState):
  messages=state['messages']
  last_message = messages[-1]

  if not last_message.tool_calls:
    return 'end'
  return 'continue'




