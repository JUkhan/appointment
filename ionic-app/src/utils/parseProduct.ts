export interface Product {
  productName: string;
  type?: string;
  quantity: number;
  unitPrice: number;
  isUnitPriceEstimated?: boolean;
  unitWord?: string;
}

export function parseProductList(input: string, lang: 'en' | 'bn'): Product[] {
  if (lang === 'bn') {
    return parseBengaliProducts(input);
  } else {
    return parseProducts(input);
  }
}

function parseProducts(input: string): Product[] {
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
          if (tokens[i] === 'price' || tokens[i] === 'unit') {
            product.quantity = 1; // Default quantity if only price is provided
            break;
          }
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
        product.isUnitPriceEstimated = tokens[i] === 'unit'; // Mark as estimated if "unit" is used without "price"
        i++;
        if (tokens[i] === 'price') {
          i++;
        }
        propCount++;
        // Skip non-numeric tokens until we find a number
        while (i < tokens.length) {
          if (tokens[i] === 'quantity') {
            product.unitPrice = 0;
            products.push(product);
            propCount = 0; // Mark as complete since we have quantity and price
            i--; // Re-evaluate this token in the next loop
            break;
          }
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

function parseBengaliProducts(input: string): Product[] {
  // Bengali to English digit mapping
  const bengaliDigitMap = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };

  // Bengali number words to digits
  const bengaliNumberWords = {
    'এক': 1, 'একটি': 1, 'একটা': 1,
    'দুই': 2, 'দুইটি': 2, 'দুইটা': 2, 'দুটি': 2, 'দুটো': 2,
    'তিন': 3, 'তিনটি': 3, 'তিনটা': 3,
    'চার': 4, 'চারটি': 4, 'চারটা': 4,
    'পাঁচ': 5, 'পাঁচটি': 5, 'পাঁচটা': 5,
    'ছয়': 6, 'ছয়টি': 6, 'ছয়টা': 6,
    'সাত': 7, 'সাতটি': 7, 'সাতটা': 7,
    'আট': 8, 'আটটি': 8, 'আটটা': 8,
    'নয়': 9, 'নয়টি': 9, 'নয়টা': 9,
    'দশ': 10, 'দশটি': 10, 'দশটা': 10,
    'এগারো': 11, 'বারো': 12, 'তেরো': 13, 'চৌদ্দ': 14,
    'পনেরো': 15, 'ষোলো': 16, 'সতেরো': 17, 'আঠারো': 18,
    'উনিশ': 19, 'বিশ': 20, 'একুশ': 21, 'বাইশ': 22,
    'তেইশ': 23, 'চব্বিশ': 24, 'পঁচিশ': 25, 'ছাব্বিশ': 26,
    'সাতাশ': 27, 'আঠাশ': 28, 'উনত্রিশ': 29, 'ত্রিশ': 30,
    'একত্রিশ': 31, 'বত্রিশ': 32, 'তেত্রিশ': 33, 'চৌত্রিশ': 34,
    'পঁয়ত্রিশ': 35, 'ছত্রিশ': 36, 'সাতত্রিশ': 37, 'আটত্রিশ': 38,
    'উনচল্লিশ': 39, 'চল্লিশ': 40, 'পঞ্চাশ': 50, 'ষাট': 60,
    'সত্তর': 70, 'আশি': 80, 'নব্বই': 90, 'একশ': 100,
    'একশো': 100, 'দুইশ': 200, 'দুইশো': 200, 'তিনশ': 300,
    'তিনশো': 300, 'চারশ': 400, 'চারশো': 400, 'পাঁচশ': 500,
    'পাঁচশো': 500, 'হাজার': 1000,
  };

  // Unit words to ignore (they describe quantity type, not product name)
  const unitWords = new Set([
    'পাতা', 'বোতল', 'প্যাকেট', 'টা', 'টি', 'খানা', 'খানি',
    'পিস', 'স্ট্রিপ', 'বক্স', 'প্যাক', 'কৌটা', 'টিউব', 'গুলো', 'বোতল'
  ]);

  // Convert Bengali digits in a string to English
  function convertBengaliDigits(str: string): string {
    //@ts-expect-error - allow string indexing
    return str.replace(/[০-৯]/g, (ch) => bengaliDigitMap[ch]);
  }

  // Try to parse a Bengali number (word or digit-based)
  function parseBengaliNumber(str: string) {
    const trimmed = str.trim();

    // Check if it's a Bengali numeral string like ৭৫, ৩০০
    if (/^[০-৯]+$/.test(trimmed)) {
      return parseInt(convertBengaliDigits(trimmed), 10);
    }

    // Check if it's a number word
    //@ts-expect-error - allow string indexing
    if (bengaliNumberWords[trimmed] !== undefined) {
      //@ts-expect-error - allow string indexing
      return bengaliNumberWords[trimmed];
    }

    // Check if it's already an English number
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    return null;
  }

  // Split input into segments by "টাকা" (taka = currency marker)
  const segments = input.split('টাকা').map(s => s.trim()).filter(Boolean);

  const products: Product[] = [];

  for (const segment of segments) {
    const words = segment.split(/\s+/);

    // The price is the last number before "টাকা"
    // Walk backwards to find the price
    let priceIndex = -1;
    let price = null;

    for (let i = words.length - 1; i >= 0; i--) {
      const num = parseBengaliNumber(words[i]);
      if (num !== null) {
        price = num;
        priceIndex = i;
        break;
      }
    }

    if (price === null || priceIndex < 0) continue;

    // Now find quantity — look for a number + optional unit word before the price
    let quantity = 1;
    let quantityStart = -1;
    let quantityEnd = -1;
    let unitWord;
    unitWord = 'টি'
    for (let i = priceIndex - 1; i >= 0; i--) {

      // Skip unit words
      if (unitWords.has(words[i])) {
        if (quantityEnd === -1) quantityEnd = i;
        unitWord = words[i]
        continue;
      }

      const num = parseBengaliNumber(words[i]);
      if (num !== null) {
        quantity = num;
        quantityStart = i;
        if (quantityEnd === -1) quantityEnd = i;
        break;
      }
      break; // Stop if we hit a non-number, non-unit word
    }

    // Product name is everything before the quantity
    const nameEnd = quantityStart !== -1 ? quantityStart : priceIndex;
    const productName = words.slice(0, nameEnd).join(' ').trim();

    // Skip prefix words like "ওর" (his/her) if it's the very first segment
    const cleanedName = productName/*.replace(/^(ওর|আর|ও)\s+/i, '')*/.trim();

    if (cleanedName) {
      products.push({
        productName: cleanedName,
        quantity: quantity,
        unitPrice: price,
        isUnitPriceEstimated: false,
        unitWord
      });
    }
  }

  return products;
}

// ---- Test ----
//const input =
// 'ওরস্যালাইন পাঁচটি পঁচিশ টাকা মন্টিন দুই পাতা 75 টাকা নিউরো বি এক বোতল ৩০০ টাকা টুথব্রাশ একটি ৭০ টাকা';

//console.log(parseBengaliProducts(input));

//console.log(parseProducts('Napa type tablet quantity unit price  Minaril quantity 5 price 2.5 '));