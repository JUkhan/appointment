export interface Product {
  productName: string;
  type?: string;
  quantity: number;
  unitPrice: number;
}

export function parseProducts(input: string): Product[] {
  const products: Product[] = [];

  // Normalize the input: convert to lowercase and split into tokens
  const tokens = input.toLowerCase().split(/\s+/);
  const numberNames = { 'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9' };
  let i = 0;
  while (i < tokens.length) {
    const product: Product = {
      productName: '',
      quantity: 0,
      unitPrice: 0
    };

    // Collect product name words until we hit a keyword
    const nameWords: string[] = [];
    while (i < tokens.length &&
      !['quantity', 'type', 'price'].includes(tokens[i])) {
      nameWords.push(tokens[i]);
      i++;
    }

    if (nameWords.length === 0) {
      i++;
      continue;
    }

    product.productName = nameWords.at(nameWords.length - 1)! //nameWords.join(' ');
    let propCount = 0;
    // Parse attributes (type, quantity, unit price)
    while (i < tokens.length) {
      if (tokens[i] === 'type' && i + 1 < tokens.length) {
        i++;
        product.type = tokens[i];
        i++;
      } else if (tokens[i] === 'quantity') {
        propCount++;
        i++;
        // Skip non-numeric tokens until we find a number
        while (i < tokens.length) {
          //@ts-expect-error - allow number words
          const qty = parseFloat(tokens[i] in numberNames ? numberNames[tokens[i]] : tokens[i]);
          if (!isNaN(qty)) {
            product.quantity = qty;
            i++;
            break;
          }
          // Skip this non-numeric token
          i++;
        }
      } else if (tokens[i] === 'price' || tokens[i] === 'unit') {
        i++;
        if (tokens[i] === 'price') {
          i++;
        }
        propCount++;
        // Skip non-numeric tokens until we find a number
        while (i < tokens.length) {
          const price = parseFloat(tokens[i]);
          if (!isNaN(price)) {
            product.unitPrice = price;
            i++;
            break;
          }
          // Skip this non-numeric token
          i++;
        }
      } else {
        // We've hit the next product name or unknown token
        break;
      }
    }
    if (propCount == 2) {
      products.push(product);
    }
  }

  return products;
}

//console.log(parseProducts('Napa type tablet quantity nine unit price 1.7 Minaril quantity 5 price 2.5 '));