from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import InMemorySaver
from agent.graph_state import GraphState
from agent.nodes import tools, model_call, should_continue


graph=StateGraph(GraphState)

graph.add_node('our-agent', model_call)

tool_node = ToolNode(tools=tools)

graph.add_node('tools', tool_node)

# edges

graph.add_edge(START, 'our-agent')

graph.add_conditional_edges(
  'our-agent',
  should_continue,
  {
    'continue': 'tools',
    'end':END
  }
)

graph.add_edge('tools', 'our-agent')

print("Graph nodes:", graph.nodes.keys())
app = graph.compile(checkpointer=InMemorySaver())
