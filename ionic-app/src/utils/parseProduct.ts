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
      !['quantity', 'type', 'unit'].includes(tokens[i])) {
      nameWords.push(tokens[i]);
      i++;
    }

    if (nameWords.length === 0) {
      i++;
      continue;
    }

    product.productName = nameWords.at(nameWords.length - 1)! //nameWords.join(' ');

    // Parse attributes (type, quantity, unit price)
    while (i < tokens.length) {
      if (tokens[i] === 'type' && i + 1 < tokens.length) {
        i++;
        product.type = tokens[i];
        i++;
      } else if (tokens[i] === 'quantity') {
        i++;
        // Skip non-numeric tokens until we find a number
        while (i < tokens.length) {
          const qty = parseFloat(tokens[i]);
          if (!isNaN(qty)) {
            product.quantity = qty;
            i++;
            break;
          }
          // Skip this non-numeric token
          i++;
        }
      } else if (tokens[i] === 'unit' && i + 1 < tokens.length && tokens[i + 1] === 'price') {
        i += 2;
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

    products.push(product);
  }

  return products;
}