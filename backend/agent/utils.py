def extract_message_content(message):
    """Extract plain text from message content, handling both string and list formats."""
    content = message.content
    if isinstance(content, list):
        # Extract text from all text blocks (new format with thought signatures)
        text_parts = []
        for block in content:
            if isinstance(block, dict) and block.get('type') == 'text':
                text_parts.append(block.get('text', ''))
            elif isinstance(block, str):
                text_parts.append(block)
        return ' '.join(text_parts)
    return content