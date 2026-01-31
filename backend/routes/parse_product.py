import re
from typing import List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class Product:
    name: str
    quantity: int
    type: str
    
    def __repr__(self):
        return f"Product(name:'{self.name}', quantity:{self.quantity}, type:'{self.type}')"


def _words_to_number(text: str) -> int:
    """Convert number words to integer."""
    word_to_digit = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
    }
    
    words = text.split()
    digits = []
    
    for word in words:
        word = word.strip()
        if word in word_to_digit:
            digits.append(word_to_digit[word])
        else: digits.append(word)
    
    if digits:
        return int(''.join(digits))
    return 0



def merge_duplicate_products_sum(products: List[Product]) -> List[Product]:
    """Merge products with same name and type, summing quantities."""
    product_dict = {}
    
    for product in products:
        key = (product.name, product.type)
        if key in product_dict:
            # Sum quantities
            product_dict[key].quantity += product.quantity
        else:
            product_dict[key] = Product(
                name=product.name,
                quantity=product.quantity,
                type=product.type
            )
    
    return list(product_dict.values())



def extract_medicine_price_patterns(text):
    """
    Extract medicine price/cost patterns from text.
    Pattern: medicine total price|cost anything? digit+|one-nine
    
    Args:
        text: Input string containing medicine and price information
        
    Returns:
        List of dictionaries containing extracted patterns
    """
    
    
    # Pattern explanation:
    # (\w+) - medicine name (one or more word characters)
    # \s+ - whitespace
    # total\s+(?:price|cost) - literal 'total' followed by 'price' or 'cost'
    # \s+ - whitespace
    # ((?:\w+\s+)*?) - optional words between total price/cost and number (non-greedy)
    # (\$?\d+|\$?one|\$?two|\$?three|\$?four|\$?five|\$?six|\$?seven|\$?eight|\$?nine) - number or number name (with optional $)
    
    pattern = r'total\s+(?:price|cost)\s+((?:\S+\s+)*?)(\$?\d+|\$?one|\$?two|\$?three|\$?four|\$?five|\$?six|\$?seven|\$?eight|\$?nine)'
    
    matches = re.finditer(pattern, text, re.IGNORECASE)
    
    results = []
    for match in matches:
        price_value = match.group(2)
        
        results.append({
            'price': price_value,
            'full_match': match.group(0)
        })
    
    if results:
        return  _words_to_number(results[0]['price'].replace('$','')), text.replace(results[0].get('full_match',''),'')
    return 0, text




def extract_medicine_patterns(text):
    """
    Extract medicine patterns from text.
    Pattern: medicine_name [tablet|syrup|powder]? quantity digit+|one-nine
    If no number found after quantity, default to '0'
    
    Args:
        text: Input string containing medicine information
        
    Returns:
        List of dictionaries containing extracted patterns
    """
    price, text = extract_medicine_price_patterns(text)
    
    # First pattern: matches quantity WITH a number
    pattern_with_number = r'(\w+)\s+(tablet|syrup|powder|injection)?\s*quantity\s+((?:(?!quantity)\S+\s+)*?)(\d+|one|two|three|four|five|six|seven|eight|nine)\b'
    
    # Second pattern: matches quantity WITHOUT a number (up to next medicine or end)
    pattern_without_number = r'(\w+)\s+(tablet|syrup|powder|injection)?\s*quantity\s+(?!(?:(?!quantity)\S+\s+)*?(?:\d+|one|two|three|four|five|six|seven|eight|nine)\b)'
    
    results = []
    
    # Find all matches with numbers
    matches_with_number = re.finditer(pattern_with_number, text, re.IGNORECASE)
    matched_positions = set()
    
    for match in matches_with_number:
        medicine_name = match.group(1)
        medicine_type = match.group(2) if match.group(2) else None
        #between_text = match.group(3).strip() if match.group(3) else None
        quantity_value =  _words_to_number(match.group(4).replace('$','0'))
        
        matched_positions.add((match.start(), match.end()))
        
        results.append(Product(
            name= medicine_name,
            type= medicine_type,
            #'between_quantity_and_number': between_text if between_text else None,
            quantity= quantity_value,
            #'full_match': match.group(0)
        ))
    
    # Find all matches without numbers
    matches_without_number = re.finditer(pattern_without_number, text, re.IGNORECASE)
    
    for match in matches_without_number:
        # Check if this position was already matched
        already_matched = False
        for start, end in matched_positions:
            if match.start() >= start and match.start() < end:
                already_matched = True
                break
        
        if not already_matched:
            medicine_name = match.group(1)
            medicine_type = match.group(2) if match.group(2) else None
            
            results.append(Product(
                name= medicine_name,
                type= medicine_type,
                quantity= 0,  # Default value
                #'full_match': match.group(0)
            ))
    
    # Sort results by position in text
    #results.sort(key=lambda x: text.index(x['full_match']))
    
    return price, results
# Test cases
if __name__ == "__main__":
    test_cases = [
        #'Napa tablet quantity 10 Baby diaper quantity 5 Baby diaper quantity 1 Total cost 1612',
        #'Napa tablet quantity 12 Baby diaper quantity 1 Total price One two three six',
        #'Paracetamol syrup quantity 2 Insulin injection quantity 3 Total cost 500',
        #'Aspirin tablet quantity 5 Vitamin C tablet quantity 10 Total price 250',
        #'Cough syrup quantity 1 Napa tablet quantity 10 Napa tablet quantity 5 Total cost Nine eight seven',
        #'Insulin injection Quantity 2 Insulin injection Quantity One Total cost Two three five six taka'
        'Napa tablet quantity sd seven minarel tablet quantity  total price Uh nine dhaka',
        'Napa tablet quantity 10 Mineral tablet quantity ah 6 total price 34'
    ]
    
    for text in test_cases:
        price, products_list = extract_medicine_patterns(text)
        print(f"Input: {text}")
        print(f"Output: {price} {merge_duplicate_products_sum(products_list)}")
        print()
    print(_words_to_number('three four 23'))
