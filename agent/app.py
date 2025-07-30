
from agent.compile_graph import app

output=''
def print_stream(stream):
    global output
    for s in stream:
        message = s['messages'][-1]
        output=message.content
        if isinstance(message, tuple):
            print(message)
        else:
            message.pretty_print()

def clear_all_message(thread_id):
    config = {"configurable": {"thread_id": thread_id}}
    current_state = app.get_state(config).values
    current_state['messages'].clear()

def run_chatbot(user_input, thread_id):
    if not thread_id:
        thread_id = "1"
    
    config = {"configurable": {"thread_id": thread_id}}
    current_state = app.get_state(config)
    # Initialize state if it doesn't exist
    if not current_state.values:
        initial_state = {
            "messages": [('human',f'user_id: {thread_id}')]
        }
    else:
        initial_state = current_state.values

    user_message = ('human', user_input)
    initial_state["messages"].append(user_message)
    print_stream(app.stream(initial_state, config, stream_mode='values'))
    return output

def run_chatbot2(user_input, thread_id):
    if not thread_id:
        thread_id = "1"
    print("user input:", user_input)
    config = {"configurable": {"thread_id": thread_id}}
    current_state = app.get_state(config)
    # Initialize state if it doesn't exist
    if not current_state.values:
        initial_state = {
            "messages": [('human',f'user_id: {thread_id}')]
        }
    else:
        initial_state = current_state.values

    user_message = ('human', user_input)
    initial_state["messages"].append(user_message)
    response = app.invoke(initial_state, config=config)
    print("len:", len(response["messages"]), 'last content:',response["messages"][-1].content)
    return response["messages"][-1].content

if __name__=='__main__':
    res=run_chatbot('add 3+7.')
    print(res)