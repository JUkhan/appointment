from langchain_core.tools import tool
from agent.model import model
from agent.graph_state import GraphState
import dateparser
from datetime import date, timedelta
from service import book_appointment, cancel_appointment, get_doctor_list, get_user_appointments
from agent.is_date_in_schedule import is_date_in_schedule, parse_date_string
from agent.utils import extract_message_content

@tool
def is_appointment_date_in_schedule(appointment_date: str, doctor_availability:str):
  """This is a week day checking function that verifies user date information match with doctor's availability"""
  return is_date_in_schedule(parse_date_string(appointment_date), doctor_availability)

@tool
def doctor_list():
  """This is a doctor list function that shows all doctors details."""
  return get_doctor_list()

@tool
def calculate_date(doctor_availability:str, date_info:str):
  """This is a date calculation function that parse complex date information to valid date string"""
  try:
    return f'appointment_date: {parse_date_string(date_info)}'
  except:

    system_prompt = """You are a date calculation assistant. Given a doctor's availability schedule and user's date request, find the next available date that matches both criteria.

Rules:
- Only suggest dates when the doctor is available
- Consider the current date and find dates in the current or next year
- Return ONLY the date in format: YYYY-MM-DD
- No explanations, just the date"""

    user_prompt = f"""Current date: {date.today()}
Doctor's available days: {doctor_availability}
User's date preference: {date_info}

Find the next available date:"""

    response = model.invoke([
      ('system', system_prompt),
      ('human', user_prompt)
    ])
    date_str=extract_message_content(response)
    print("available_date from calculate_date tool:", date_str)
    return f"appointment_date: {dateparser.parse(date_str).strftime('%a, %B %d, %Y')}"

@tool
def cancel_doctor_appointment(appointment_id: str, user_id: str):
  """This is a doctor appointment canceling function"""
  return cancel_appointment(appointment_id, user_id)

@tool
def get_appointment_list(user_id: str):
  """This is a function fetching list of appointments"""
  return get_user_appointments(user_id)

@tool
def doctor_appointment(user_id: str, doctor_id: str, doctor_name: str, appointment_date:str, patient_name:str, patient_age:int):
  """This is a doctor appointment booking function"""
  return book_appointment(user_id=user_id, doctor_id=doctor_id, date=parse_date_string(appointment_date), patient_name=patient_name, patient_age=patient_age)

tools=[cancel_doctor_appointment,calculate_date, doctor_appointment, doctor_list, is_appointment_date_in_schedule, get_appointment_list]

tools_model = model.bind_tools(tools)

def model_call(state: GraphState):
  # Extract user_id from the first message
  first_message = extract_message_content(state['messages'][0]) #state['messages'][0].content if hasattr(state['messages'][0], 'content') else str(state['messages'][0][1])

  system_prompt = f"""You are a medical appointment booking assistant. Your role is to help patients book appointments with doctors.

IMPORTANT: When calling the doctor_appointment tool, always use this {first_message}

Guidelines:
1. If the patient hasn't mentioned a doctor's name or reason for visit, politely ask for this information
2. Use the doctor_list tool to retrieve available doctors
3. Before calling doctor_appointment tool, confirm ALL booking details with the patient:
   - Doctor name
   - Appointment date
   - Patient name
   - Patient age
4. Be professional and helpful"""
  print(system_prompt)
  response=tools_model.invoke([('system', system_prompt)]+state['messages'])
  state['messages']=[response]
  return state

def should_continue(state:GraphState):
  messages=state['messages']
  last_message = messages[-1]

  if not last_message.tool_calls:
    return 'end'
  return 'continue'




