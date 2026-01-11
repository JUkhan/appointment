from datetime import datetime, timedelta
import re
import dateparser

def parse_date_string(date_str):
    """
    Parse date string in English, Bangla, or mixed format and return formatted date.
    Always returns current or future dates (if date is in past, moves to next year).
    
    Args:
        date_str: Date string like 'Monday, January 15th', 'সোমবার, জানুয়ারি ১৪', 
                  or just 'Monday', 'সোমবার' (weekday only)
    
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
    
    # Replace Bangla days with English
    for bangla, english in bangla_days.items():
        normalized = normalized.replace(bangla, english)
    
    # Convert Bangla numbers to English
    normalized = convert_bangla_to_english_number(normalized)
    
    # Remove ordinal suffixes (st, nd, rd, th)
    normalized = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', normalized)
    
    # Extract month, day, and year
    months = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December']
    
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    month = None
    day = None
    year = None
    weekday_name = None
    
    # Find weekday
    for wd in weekdays:
        if wd in normalized:
            weekday_name = wd
            break
    
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
    
    # Handle weekday-only input: find next occurrence of that weekday
    if weekday_name and not month and not day:
        today = datetime.now()
        target_weekday = weekdays.index(weekday_name)  # 0=Monday, 6=Sunday
        current_weekday = today.weekday()  # 0=Monday, 6=Sunday
        
        # Calculate days until target weekday
        days_ahead = target_weekday - current_weekday
        if days_ahead <= 0:  # Target day already happened this week or is today
            days_ahead += 7  # Go to next week
        
        target_date = today + timedelta(days=days_ahead)
        return target_date.strftime('%a, %B %d, %Y')
    
    # Create date object and format for full date strings
    if month and day:
        month_num = months.index(month) + 1
        date_obj = datetime(year, month_num, day)
        
        # Check if date is in the past
        today = datetime.now()
        if date_obj.date() < today.date():
            # Move to next year
            date_obj = datetime(year + 1, month_num, day)
        
        return date_obj.strftime('%a, %B %d, %Y')
    else:
        raise ValueError(f"Could not parse date from: {date_str}")

def validate_date(date_string, format_string='%a, %B %d, %Y'):
    try:
        
        return (True, dateparser.parse(date_string))
    except ValueError as e:
        print(f"Invalid date: {e}")
        return (False, None)
# Example usage:
if __name__ == "__main__":
    # Test with weekday only
    print("Weekday only:")
    print(parse_date_string("Monday"))  # Next Monday
    print(parse_date_string("সোমবার"))  # Next Monday in Bangla
    print(parse_date_string("Saturday"))  # Next Monday
    print()
    
    # Test with dates that might be in the past
    print("Date parsing (will move to future if needed):")
    print(f"Current date: {datetime.now().strftime('%a, %B %d, %Y')}")
    print(f"'January 5': {parse_date_string('January 5')}")  # Will be next year if current month is after January
    print(f"'December 25': {parse_date_string('December 25')}")  # Will be this year or next year depending on current date
    print()
    
    # Test with full date
    print("Full date with year:")
    print(parse_date_string("Monday, January 15th, 2025"))
    print(parse_date_string("সোমবার, জানুয়ারি ১৫"))

    print(validate_date("Thu, January 15, 2026"))


