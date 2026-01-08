from datetime import datetime
import re

def parse_date_string(date_str):
    """
    Parse date string in English, Bangla, or mixed format and return formatted date.
    
    Args:
        date_str: Date string like 'Monday, January 15th', 'সোমবার, জানুয়ারি ১৪', etc.
    
    Returns:
        Formatted date string like 'Mon, December 25, 2023'
    """
    
    # Bangla to English mappings
    bangla_months = {
        'জানুয়ারি': 'January',
        'ফেব্রুয়ারি': 'February',
        'মার্চ': 'March',
        'এপ্রিল': 'April',
        'মে': 'May',
        'জুন': 'June',
        'জুলাই': 'July',
        'আগস্ট': 'August',
        'সেপ্টেম্বর': 'September',
        'অক্টোবর': 'October',
        'নভেম্বর': 'November',
        'ডিসেম্বর': 'December'
    }
    
    bangla_days = {
        'সোমবার': 'Monday',
        'মঙ্গলবার': 'Tuesday',
        'বুধবার': 'Wednesday',
        'বৃহস্পতিবার': 'Thursday',
        'শুক্রবার': 'Friday',
        'শনিবার': 'Saturday',
        'রবিবার': 'Sunday'
    }
    
    # Bangla numeral to English numeral
    bangla_digits = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    }
    
    # Convert Bangla numerals to English
    def convert_bangla_to_english_number(text):
        for bangla, english in bangla_digits.items():
            text = text.replace(bangla, english)
        return text
    
    # Normalize the input
    normalized = date_str
    
    # Replace Bangla months with English
    for bangla, english in bangla_months.items():
        normalized = normalized.replace(bangla, english)
    
    # Replace Bangla days with English (though we don't really need the day name for parsing)
    for bangla, english in bangla_days.items():
        normalized = normalized.replace(bangla, english)
    
    # Convert Bangla numbers to English
    normalized = convert_bangla_to_english_number(normalized)
    
    # Remove ordinal suffixes (st, nd, rd, th)
    normalized = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', normalized)
    
    # Extract month, day, and year
    months = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December']
    
    month = None
    day = None
    year = None
    
    # Find month
    for m in months:
        if m in normalized:
            month = m
            break
    
    # Find day (1-31)
    day_match = re.search(r'\b(\d{1,2})\b', normalized)
    if day_match:
        day = int(day_match.group(1))
    
    # Find year (4 digits)
    year_match = re.search(r'\b(20\d{2}|19\d{2})\b', normalized)
    if year_match:
        year = int(year_match.group(1))
    else:
        year = datetime.now().year
    
    # Create date object and format
    if month and day:
        month_num = months.index(month) + 1
        date_obj = datetime(year, month_num, day)
        return date_obj.strftime('%a, %B %d, %Y')
    else:
        raise ValueError(f"Could not parse date from: {date_str}")


# Test cases
if __name__ == "__main__":
    test_cases = [
        'Monday, January 15th',
        'সোমবার, জানুয়ারি ১৪',
        'Monday January 15th 2025',
        'December 25th 2023',
        'জুলাই ২৮',
        'March 3rd'
    ]
    
    for test in test_cases:
        try:
            result = parse_date_string(test)
            print(f"Input:  {test}")
            print(f"Output: {result}\n")
        except Exception as e:
            print(f"Error parsing '{test}': {e}\n")