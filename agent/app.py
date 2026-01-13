
from agent.compile_graph import app
from agent.utils import extract_message_content
from datetime import datetime, timedelta

last_activity = {}
MAX_MESSAGES = 20
INACTIVITY_TIMEOUT = timedelta(minutes=30)

def run_chatbot(user_input, thread_id):
    if not thread_id:
        thread_id = "1"
    
    config = {"configurable": {"thread_id": thread_id}}
    current_state = app.get_state(config)
    
    # Check for inactivity
    now = datetime.now()
    should_reset = False
    if thread_id in last_activity:
        if now - last_activity[thread_id] > INACTIVITY_TIMEOUT:
            should_reset = True
    
    last_activity[thread_id] = now
    
    # Initialize or reset state
    if not current_state.values or should_reset:
        initial_state = {
            "messages": [('human', f'user_id: {thread_id}')]
        }
    else:
        initial_state = current_state.values
        
        # Limit message history
        if len(initial_state["messages"]) > MAX_MESSAGES:
            initial_state["messages"] = [initial_state["messages"][0]] + \
                                       initial_state["messages"][-(MAX_MESSAGES-1):]
    
    user_message = ('human', user_input)
    initial_state["messages"].append(user_message)
    response = app.invoke(initial_state, config=config)
    
    last_message = response["messages"][-1]
    content = extract_message_content(last_message)
    
    print("len:", len(response["messages"]), 'last content:', content)
    return content

if __name__=='__main__':
    res=run_chatbot('add 3+7.')
    print(res)