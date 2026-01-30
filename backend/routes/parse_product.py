import re
from typing import List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class Product:
    item_name: str
    item_quantity: int
    item_type: str
    
    def __repr__(self):
        return f"Product(item_name:'{self.item_name}', item_quantity:{self.item_quantity}, item_type:'{self.item_type}')"


def parse_products(text: str) -> Tuple[List[Product], Optional[int]]:
    """
    Parse product text and extract product list with total cost.
    
    Args:
        text: Input string containing products and total cost
        
    Returns:
        Tuple of (product_list, total_cost)
    """
    if not text:
        return ([], None)
    
    text = text.strip()
    
    # Extract total cost first (remove it from text for product parsing)
    total_cost = _extract_total_cost(text)
    
    # Remove total cost portion from text
    text_without_total = _remove_total_section(text)
    
    # Extract products
    products = _extract_products(text_without_total)
    
    return (products, total_cost)


def _extract_total_cost(text: str) -> Optional[int]:
    """Extract total cost from text."""
    # Pattern 1: "Total cost 1612" or "Total price 1612"
    pattern1 = r'(?:total\s+(?:cost|price))\s+(\d+)'
    match = re.search(pattern1, text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    
    # Pattern 2: "Total cost One two three six" -> 1236
    pattern2 = r'(?:total\s+(?:cost|price))\s+((?:zero|one|two|three|four|five|six|seven|eight|nine|\s)+)'
    match = re.search(pattern2, text, re.IGNORECASE)
    if match:
        number_text = match.group(1).strip()
        return _words_to_number(number_text)
    
    return None


def _words_to_number(text: str) -> int:
    """Convert number words to integer."""
    word_to_digit = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
    }
    
    words = text.lower().split()
    digits = []
    
    for word in words:
        word = word.strip()
        if word in word_to_digit:
            digits.append(word_to_digit[word])
    
    if digits:
        return int(''.join(digits))
    return 0


def _remove_total_section(text: str) -> str:
    """Remove total cost/price section from text."""
    # Remove everything after "Total cost" or "Total price"
    pattern = r'(total\s+(?:cost|price)).*$'
    text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    return text.strip()


def _extract_products(text: str) -> List[Product]:
    """Extract products from text."""
    products = []
    product_types = ['tablet', 'syrup', 'injection']
    
    # Pattern: "Product name [type] quantity N"
    # More flexible pattern to handle various formats
    pattern = r'([A-Za-z\s]+?)\s*(?:(tablet|syrup|injection)\s+)?quantity\s+([\d\w]+)'
    
    matches = re.finditer(pattern, text, re.IGNORECASE)
    
    for match in matches:
        item_name = match.group(1).strip()
        item_type = match.group(2).lower() if match.group(2) else ''
        item_quantity = int(match.group(3)) if match.group(3).isdecimal() else _words_to_number(match.group(3))
        print(item_name, item_quantity)
        # Clean up item name (remove extra spaces)
        item_name = ' '.join(item_name.split())
        
        products.append(Product(
            item_name=item_name,
            item_quantity=item_quantity,
            item_type=item_type
        ))
    
    # Merge duplicate products (same name and type, sum quantities)
    merged_products = _merge_duplicate_products_sum(products)
    
    return merged_products


def _merge_duplicate_products_sum(products: List[Product]) -> List[Product]:
    """Merge products with same name and type, summing quantities."""
    product_dict = {}
    
    for product in products:
        key = (product.item_name, product.item_type)
        if key in product_dict:
            # Sum quantities
            product_dict[key].item_quantity += product.item_quantity
        else:
            product_dict[key] = Product(
                item_name=product.item_name,
                item_quantity=product.item_quantity,
                item_type=product.item_type
            )
    
    return list(product_dict.values())


# Test cases
if __name__ == "__main__":
    test_cases = [
        #'Napa tablet quantity 10 Baby diaper quantity 5 Baby diaper quantity 1 Total cost 1612',
        #'Napa tablet quantity 12 Baby diaper quantity 1 Total price One two three six',
        #'Paracetamol syrup quantity 2 Insulin injection quantity 3 Total cost 500',
        #'Aspirin tablet quantity 5 Vitamin C tablet quantity 10 Total price 250',
        #'Cough syrup quantity 1 Napa tablet quantity 10 Napa tablet quantity 5 Total cost Nine eight seven',
        'Insulin injection Quantity 2 Insulin injection Quantity One Total cost Two three five six'
    ]
    
    for text in test_cases:
        products, total_cost = parse_products(text)
        print(f"Input: {text}")
        print(f"Output: ({products}, {total_cost})")
        print()
    print(_words_to_number('three four'))
